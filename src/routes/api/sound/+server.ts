import { json } from '@sveltejs/kit';
import { table } from '$lib/server/db';
import { inArray } from 'drizzle-orm';

export const GET = async ({ request, locals }) => {
	const { soundIds }: { soundIds: [string] } = await request.json();
	const sound = await locals.db.select().from(table.sounds).where(inArray(table.sounds.id, soundIds))
	return json({ status: 200, data: sound })
};