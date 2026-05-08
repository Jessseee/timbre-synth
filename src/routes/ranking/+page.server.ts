import { validateTurnstileClientToken } from '$lib/server/turnstile';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { assignTasks, unassignTasks } from '$lib/server/task';
import { orderSoundsByAnnotation } from '$lib/server/sound';
import { type Descriptor } from '$lib/frontend/Task'

export const load = async ({ locals }) => {
	let tasks = locals.session!.tasks;
	if (tasks.length === 0) {
		tasks = await assignTasks(locals.session!.id, locals.db);
	}

	if (tasks.length === 0) {
		return { tasks: null }
	}

	return {
		tasks: tasks.map(({ id, descriptor, sounds, annotations }) => ({
			id,
			descriptor: descriptor as Descriptor,
			sounds: orderSoundsByAnnotation(
				sounds,
				annotations.find(
					(annotation) => annotation.annotatorId === locals.session!.id)
				)
		}))
	};
};

export const actions = {
	default: async ({ request, fetch, locals }) => {
		const data = await request.formData();
		const token = data.get('cf-turnstile-token')?.toString();
		if (!token) return fail(500, { error: 'Did not pass client-side verification.' });
		if (!(await validateTurnstileClientToken(token, fetch))) {
			return fail(500, { error: 'Did not pass server-side verification.' });
		}

		const tasks = JSON.parse(data.get('tasks')!.toString());
		await fetch('/annotation/ranking', {
			method: 'POST',
			body: JSON.stringify({
				tasks,
				status: 'done'
			})
		});
		await unassignTasks(locals.session!.id, locals.db);

		const query = await locals.db.query.questionnaires.findFirst({
			where: ({ annotatorId }) => eq(annotatorId, locals.session!.id)
		});
		if (!!query) {
			return redirect(303, '/ranking/done');
		}
		return redirect(303, '/ranking/questionnaire');
	}
};
