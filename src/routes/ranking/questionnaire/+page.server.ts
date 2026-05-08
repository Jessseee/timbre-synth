import { fail, redirect } from '@sveltejs/kit';
import { validateTurnstileClientToken } from '$lib/server/turnstile';
import { table } from '$lib/server/db';

export const actions = {
	default: async ({ request, locals, fetch }) => {
		const data = await request.formData();
		const token = data.get('cf-turnstile-token')?.toString();
		if (!token) return fail(500, { error: 'Did not pass client-side verification.' });
		if (!(await validateTurnstileClientToken(token, fetch))) {
			return fail(500, { error: 'Did not pass server-side verification.' });
		}

		const questionnaire = [
			data.get('questionnaire[0]'),
			data.get('questionnaire[1]'),
			data.get('questionnaire[2]')
		];

		try {
			await locals.db.insert(table.questionnaires).values({
				annotatorId: locals.session!.id,
				questionnaire: JSON.stringify(questionnaire),
				createdAt: new Date()
			});
		} catch (error) {
			console.error(error);
			return fail(500, { error: 'Failed to submit questionnaire.' });
		}

		redirect(302, '/ranking/done');
	}
};
