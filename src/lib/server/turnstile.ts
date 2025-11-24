import { env } from '$env/dynamic/private';

export async function validateTurnstileClientToken(token: string, fetch: typeof global.fetch) {
	const body = new FormData();
	body.append('secret', env.CF_TURNSTILE_SECRET);
	body.append('response', token);
	try {
		const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body: body
		});
		if (!res.ok) console.error(res);
		return res.ok;
	} catch (error) {
		console.error(error);
		return false;
	}
}
