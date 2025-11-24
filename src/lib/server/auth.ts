import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { type DrizzleClient, table } from '$lib/server/db';

export const sessionCookieName = 'session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	return encodeBase64url(bytes);
}

export async function createAdminSession(token: string, db: DrizzleClient) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = { id: sessionId, admin: true, createdAt: new Date() };
	await db.insert(table.session).values(session);
	return session;
}

export async function createSession(token: string, db: DrizzleClient) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = { id: sessionId, admin: false, createdAt: new Date() };
	await db.insert(table.session).values(session);
	return session;
}

export async function getSessionFromDatabase(token: string, db: DrizzleClient) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session = await db.query.session.findFirst({
		where: ({ id }) => eq(id, sessionId),
		with: {
			tasks: {
				with: {
					sounds: true,
					annotations: {
						where: (annotations, { eq }) => eq(annotations.annotatorId, sessionId)
					}
				}
			}
		}
	});
	if (!session) {
		return { session: null };
	}
	return { session };
}

export type Session = Awaited<ReturnType<typeof getSessionFromDatabase>>;

export function setSessionTokenCookie(event: RequestEvent, token: string) {
	event.cookies.set(sessionCookieName, token, { path: '/' });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}
