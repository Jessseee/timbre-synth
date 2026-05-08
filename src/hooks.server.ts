import * as auth from '$lib/server/auth';
import { error, type Handle, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sequence } from '@sveltejs/kit/hooks';
import { createD1Client, createLibSqlClient } from '$lib/server/db';

const db = env.DATABASE_URL ? createLibSqlClient(env.DATABASE_URL) : null;

const handleDB: Handle = async ({ event, resolve }) => {
	if (event.platform?.env.DB) {
		event.locals.db = createD1Client(event.platform.env.DB);
	} else if (db) {
		event.locals.db = db;
	} else {
		throw new Error('No database found');
	}

	return resolve(event)
}

const handleSession: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.session = null;
		return resolve(event);
	}

	const { session } = await auth.getSessionFromDatabase(sessionToken, event.locals.db);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.session = session;
	return resolve(event);
};

const handleRoute: Handle = async ({ event, resolve }) => {
	const hasAPIAuth =
		env.API_KEY !== '' && event.request.headers.get('Authentication') === `Bearer ${env.API_KEY}`;

	// Admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (!env.ADMIN_PASSWORD) {
			console.warn('No admin password set in .env.local');
			error(403);
		}
		if (event.url.pathname === '/admin/login') {
			if (event.locals.session?.admin) {
				redirect(303, '/admin/synth');
			} else {
				return resolve(event);
			}
		}
		if (!event.locals.session?.admin) {
			redirect(303, '/admin/login');
		}
	}
	// Signup route, check signup key
	else if (event.url.pathname.endsWith('/signup')) {
		if (event.locals.session) {
			redirect(303, '/');
		}
		const key = event.url.searchParams.get('key') ?? '';
		if (!env.SIGNUP_KEY && key !== env.SIGNUP_KEY) {
			error(404);
		}
	}
	// API routes
	else if (event.url.pathname.startsWith('/api')) {
		if (!event.locals.session?.admin && !hasAPIAuth) {
			return error(401);
		}
	}
	// No session, no access
	else if (!event.locals.session && !hasAPIAuth) {
		return error(401);
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleDB, handleSession, handleRoute);
