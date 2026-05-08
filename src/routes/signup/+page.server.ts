import { redirect } from '@sveltejs/kit';

export function load({ request }) {
	const key = new URL(request.url).searchParams.get('key');
	redirect(302, `/robots/signup?key=${key}`);
}