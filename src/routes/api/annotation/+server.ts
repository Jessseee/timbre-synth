import { error, json } from '@sveltejs/kit';
import { table } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';

export const GET = async ({ locals }) => {
	const tasks = await locals.db.query.annotations.findMany({
		with: {
			annotator: true,
			task: true
		}
	})
	return json(tasks)
}

export const DELETE = async ({ request, locals }) => {
	const { taskId, annotatorId }: { taskId: string, annotatorId: string } = await request.json();
	if (!taskId || !annotatorId) error(400, "missing annotation ids.")

	await locals.db.delete(table.annotations).where(and(
		eq(table.annotations.annotatorId, annotatorId),
		eq(table.annotations.taskId, taskId)
	));

	return json({ status: 200 })
}

export const POST = async ({ request, locals }) => {
	const { tasks, status, annotatorId }: {
		tasks: [{
			id: string,
			sounds: [{ id: number, sound: string }]
		}],
		status: 'pending' | 'done',
		annotatorId: string
	} = await request.json();

	for (const task of tasks) {
		const rank = task.sounds;
		await locals.db
			.insert(table.annotations)
			.values({
				annotatorId: annotatorId,
				taskId: task.id,
				createdAt: new Date(),
				rank,
				status
			})
			.onConflictDoUpdate({
				target: [table.annotations.taskId, table.annotations.annotatorId],
				set: { status, rank }
			});
	}

	return json({ status: 200 });
};