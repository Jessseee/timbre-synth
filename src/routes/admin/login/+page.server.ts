import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const actions = {
	default: async (event) => {
		try {
			const data = await event.request.formData();
			const password = data.get('password');
			if (password !== env.ADMIN_PASSWORD) {
				return fail(403, { error: 'Wrong password' });
			}
			const sessionToken = auth.generateSessionToken();
			await auth.createAdminSession(sessionToken, event.locals.db);
			auth.setSessionTokenCookie(event, sessionToken);
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'An error has occurred' });
		}
		return redirect(302, '/admin/synth');
	}
};
