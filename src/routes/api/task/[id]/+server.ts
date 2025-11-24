import { table } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

export const DELETE = async ({ params, locals }) => {
	try {
		await locals.db.delete(table.taskSounds).where(eq(table.taskSounds.taskId, params.id));
		await locals.db.delete(table.tasks).where(eq(table.tasks.id, params.id));
	} catch (e) {
		console.error(e)
		error(500, 'Failed to delete task.');
	}
	return json({ status: 200 });
};