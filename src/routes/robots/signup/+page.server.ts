import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async (event) => {
		try {
			const sessionToken = auth.generateSessionToken();
			await auth.createSession(sessionToken, event.locals.db);
			auth.setSessionTokenCookie(event, sessionToken);
		} catch {
			return fail(500, { error: 'An error has occurred' });
		}
		return redirect(302, '/robots');
	}
};
