import { validateTurnstileClientToken } from '$lib/server/turnstile';
import { fail, redirect } from '@sveltejs/kit';
import { getTutorialTasks } from '$lib/server/task';
import type { Descriptor } from '$lib/frontend/Task';

export const load = async ({ locals }) => {
	const tasks = await getTutorialTasks(locals.db);

	return {
		tasks: tasks.map(({ id, descriptor, sounds }) => ({
			id,
			descriptor: descriptor as Descriptor,
			sounds: sounds.map(({ soundId }, index) => ({ id: index, sound: soundId }))
		}))
	};
};

export const actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const token = data.get('cf-turnstile-token')?.toString();
		if (!token) return fail(500, { error: 'Did not pass client-side verification.' });
		if (!(await validateTurnstileClientToken(token, fetch))) {
			return fail(500, { error: 'Did not pass server-side verification.' });
		}

		const tasks = JSON.parse(data.get('tasks')!.toString());
		await fetch('/annotation', {
			method: 'POST',
			body: JSON.stringify({
				tasks,
				status: 'done'
			})
		});

		return redirect(303, '/ranking');
	}
};
