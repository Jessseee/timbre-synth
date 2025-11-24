import { table } from '$lib/server/db';
import { createTasks } from '$lib/server/task';
import { error, json } from '@sveltejs/kit';
import type { Sample } from '$lib/frontend/Synth';
import { eq, inArray } from 'drizzle-orm';
import { descriptorNames } from '$lib/frontend/Task';

export const GET = async ({ locals }) => {
	const tasks = await locals.db.query.tasks.findMany({
		with: {
			annotations: true
		}
	})
	return json(tasks)
}

export const POST = async ({ request, locals }) => {
	let { samples }: { samples: Sample[] } = await request.json();

	try {
		for (const descriptor of descriptorNames) {
			const tasksToInsert = await createTasks(samples, { descriptor });
			for (const { id: taskId, sounds } of tasksToInsert) {
				await locals.db.batch([
					locals.db.insert(table.tasks).values({ id: taskId, descriptor }),
					locals.db.insert(table.taskSounds).values(
						sounds.map((soundId: string) => ({
							taskId,
							soundId
						}))
					)
				])
			}
		}
	} catch (err) {
		console.error(err)
		return error(500, 'Failed to create tasks.');
	}

	return json({ status: 200 });
};

export const DELETE = async ({ request, locals }) => {
	let { ids }: { ids: [string] } = await request.json();
	try {
		await locals.db.delete(table.tasks).where(inArray(table.tasks.id, ids));
	} catch {
		error(500, 'Failed to delete sound.');
	}

	return json({ status: 200 });
}