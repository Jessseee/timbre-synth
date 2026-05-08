import { hashObject } from '$lib/server/hash';
import type { Sample } from '$lib/frontend/Synth';
import { error } from '@sveltejs/kit';
import { type DrizzleClient, table } from '$lib/server/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { type RankingTask, descriptorNames, type Descriptor } from '$lib/frontend/Task';

function prng(seed = 42) {
	let s = seed >>> 0;
	return () => (s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32;
}

function shuffleInPlace<T>(arr: T[], rnd = Math.random) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
}

function weightedSampleWithoutReplacement<T>(
	items: T[],
	weights: number[],
	k: number,
	rnd: () => number
): number[] {
	if (k > items.length) throw new Error('k > items in weighted sample');
	const chosen: number[] = [];

	// Use Efraimidis–Spirakis-style key trick
	const keys = weights.map((w) => {
		const u = Math.max(1e-12, rnd());
		// If weight is 0, give key a very low value so it never gets picked
		return w > 0 ? Math.pow(u, 1 / w) : -Infinity;
	});

	// Take the top-k keys
	const indices = keys.map((_, i) => i);
	indices.sort((a, b) => keys[b] - keys[a]); // descending
	for (let i = 0; i < k; i++) chosen.push(indices[i]);

	return chosen;
}

/**
 * Create multi-item ranking tasks with controllable average appearances per sound.
 * - Ensures each sound appears ~avgAppearances times on average.
 * - Fills tasks by weighted sampling based on remaining quotas (no duplicates within a task).
 * @param samples The sound samples to create tasks for
 * @param options Options for the task generator
 * @param options.groupSize Sounds per task
 * @param options.avgAppearances Target average appearances per sound
 * @param options.seed Randomization seed for deterministic sampling and shuffling
 * @param options.descriptor Timbre descriptor label
 */
export async function createTasks(
	samples: Sample[],
	options?: {
		groupSize?: number;
		avgAppearances?: number;
		seed?: number;
		descriptor?: Descriptor;
	}
): Promise<RankingTask[]> {
	const { groupSize = 7, avgAppearances = 5, seed = 42, descriptor = 'brightness' } = options ?? {};

	if (!Array.isArray(samples) || samples.length === 0) return [];
	if (groupSize <= 1) throw new Error('groupSize must be >= 2');
	if (groupSize > samples.length) {
		throw new Error('groupSize cannot exceed number of samples.');
	}

	const rnd = prng(seed);

	const N = samples.length;
	const k = groupSize;

	// Compute total slots and quotas
	let totalSlots = Math.ceil((N * avgAppearances) / k) * k;

	if (totalSlots === 0) return [];

	const tasksCount = Math.floor(totalSlots / k);

	// Base equal quota per item, distribute remainder randomly but deterministically
	const quota = Math.floor(totalSlots / N);
	let remainder = totalSlots - quota * N;

	const quotas = new Array<number>(N).fill(quota);
	// Distribute remainders to random distinct items
	const index = [...Array(N).keys()];
	if (remainder > 0) shuffleInPlace(index, rnd);
	for (let i = 0; i < remainder; i++) quotas[index[i]] += 1;

	// Generate tasks by weighted sampling on remaining quotas
	const tasks: RankingTask[] = [];
	// Precompute a stable order of items to keep selection deterministic across equal weights
	const stableOrder = [...Array(N).keys()];
	shuffleInPlace(stableOrder, rnd);

	for (let t = 0; t < tasksCount; t++) {
		const poolIndex = stableOrder.filter((i) => quotas[i] > 0);
		if (poolIndex.length < k) {
			const needed = k - poolIndex.length;
			const extras = stableOrder.filter((i) => !poolIndex.includes(i)).slice(0, needed);
			poolIndex.push(...extras);
		}

		const poolWeights = poolIndex.map((i) => quotas[i]);

		// Pick k unique items biased by remaining quota
		const chosenPoolPositions = weightedSampleWithoutReplacement(poolIndex, poolWeights, k, rnd);
		const chosenIndex = chosenPoolPositions.map((pos) => poolIndex[pos]);

		// Decrement quotas
		for (const i of chosenIndex) quotas[i] -= 1;

		// shuffle task item order
		const itemsRaw = chosenIndex.map((i) => samples[i]);
		shuffleInPlace(itemsRaw, rnd);

		const sounds = itemsRaw.map((item, i) => item.id);

		const id = await hashObject({ descriptor, sounds });

		tasks.push({ id, descriptor, sounds });
	}

	return tasks;
}

/**
 * Get a number of tasks for a specific descriptor which do not have any annotations yet.
 * @param n The number of tasks to select.
 * @param descriptor The descriptor to select the tasks for.
 * @param db The Drizzle ORM client
 */
async function getUnannotatedTasks(n: number, descriptor: string, db: DrizzleClient) {
	const tasks = await db.query.tasks.findMany({
		where: ({ id }) =>
			sql`NOT EXISTS (
				SELECT 1
				FROM ${table.annotations}
				WHERE ${table.annotations}.task_id = ${id}
			) AND ${table.tasks.descriptor} = ${descriptor}`,
		orderBy: () => sql`RANDOM()`,
		columns: { id: true },
		limit: n
	});
	return tasks.map((task) => task.id);
}

/**
 * Get the tutorial tasks if any are selected. Otherwise, select a random task for each descriptor,
 * set the tutorial flag and return the newly selected tasks.
 */
async function selectTutorialTasks(db: DrizzleClient) {
	let taskIds = (
		await db.select().from(table.tasks).where(eq(table.tasks.tutorial, true))
	).map(({ id }) => id);

	if (taskIds.length === 0) {
		taskIds = await Promise.all(
			descriptorNames.flatMap(async (descriptor) => {
				return (await db.query.tasks.findFirst({
					where: ({ id }) =>
						sql`NOT EXISTS (
						SELECT 1
						FROM ${table.annotations}
						WHERE ${table.annotations}.task_id = ${id}
					) AND ${table.tasks.descriptor} = ${descriptor}`,
					orderBy: () => sql`RANDOM()`,
					columns: { id: true }
				}))!.id;
			})
		);

		await db.update(table.tasks).set({ tutorial: true }).where(inArray(table.tasks.id, taskIds));
	}

	return taskIds;
}

export async function getTutorialTasks(db: DrizzleClient) {
	const taskIds = await selectTutorialTasks(db);

	if (taskIds.length === 0) {
		return error(404, `No tasks found.`);
	}

	return db.query.tasks.findMany({
		where: (t, { inArray }) => inArray(t.id, taskIds),
		orderBy: table.tasks.descriptor,
		with: {
			sounds: true,
			annotations: true
		}
	});
}

export async function assignTasks(sessionId: string, db: DrizzleClient) {
	let taskIds: Awaited<ReturnType<typeof getUnannotatedTasks>> = [];
	for (const descriptor of descriptorNames) {
		taskIds = taskIds.concat(await getUnannotatedTasks(5, descriptor, db));
	}

	if (taskIds.length === 0) {
		return [];
	}

	await db.update(table.tasks).set({ sessionId }).where(inArray(table.tasks.id, taskIds));

	return db.query.tasks.findMany({
		where: (t, { inArray }) => inArray(t.id, taskIds),
		orderBy: table.tasks.descriptor,
		with: {
			sounds: true,
			annotations: true
		}
	});
}

export async function unassignTasks(sessionId: string, db: DrizzleClient) {
	await db.update(table.tasks).set({ sessionId: null }).where(eq(table.tasks.sessionId, sessionId));
}

