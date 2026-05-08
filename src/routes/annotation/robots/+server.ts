import { table } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export const POST = async ({ request, locals }) => {
	const { tasks, status }: { tasks: any; status: 'pending' | 'done' } = await request.json();

	for (const task of tasks) {
		const data = {sound: task.sound, soundId: task.soundId};
		await locals.db
			.insert(table.annotations)
			.values({
				annotatorId: locals.session!.id,
				taskId: task.id,
				createdAt: new Date(),
				type: "robot",
				data,
				status
			})
			.onConflictDoUpdate({
				target: [table.annotations.taskId, table.annotations.annotatorId],
				set: { status, data }
			});
	}

	return json({ status: 200 });
};