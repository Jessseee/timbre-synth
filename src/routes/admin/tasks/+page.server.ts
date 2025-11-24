import { table } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const tasks = await locals.db.query.tasks.findMany({
		with: {
			annotations: true,
			sounds: true
		}
	});

	return {
		tasks
	};
};

export const actions = {
	clearAssigned: async ({ locals, request }) => {
		await locals.db.update(table.tasks).set({sessionId: null})
		redirect(303, "/admin/tasks")
	},
	clearPending: async ({ locals, request }) => {
		await locals.db.delete(table.annotations).where(eq(table.annotations.status, "pending"))
		redirect(303, '/admin/tasks');
	},
	clearTasks: async ({ locals, request }) => {
		await locals.db.delete(table.annotations);
		await locals.db.delete(table.taskSounds);
		await locals.db.delete(table.tasks);
		redirect(303, '/admin/tasks');
	}
};
