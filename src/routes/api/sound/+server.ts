import { hashObject } from '$lib/server/hash';
import { writeFile, mkdir } from 'node:fs/promises';
import { error, json } from '@sveltejs/kit';
import { table } from '$lib/server/db';
import type { MidiItem, Params } from '$lib/frontend/Synth';
import { inArray } from 'drizzle-orm';

export const POST = async ({ request, locals, platform }) => {
	const { params, notes, b64 }: { params: Params, notes: MidiItem[], b64: string} = await request.json();
	const buf = Buffer.from(b64, 'base64');
	const id = await hashObject(params);
	try {
		await locals.db.insert(table.sounds).values({ id, params, notes });
	} catch {
		error(500, 'Failed to create sound.');
	}
	try {
		if (platform?.env.R2) {
			await platform.env.R2.put(`${id}.wav`, new Uint8Array(buf));
		} else {
			await mkdir('./storage/sounds/', { recursive: true });
			const outFile = `./storage/sounds/${id}.wav`;
			await writeFile(outFile, buf);
		}
	} catch (err) {
		await locals.db.delete(table.sounds).values({ id });
		console.error(err)
		error(500, 'Failed to create sound.');
	}
	return json({ id }, { status: 200 });
};

export const GET = async ({ request, locals }) => {
	const { soundIds }: { soundIds: [string] } = await request.json();
	const sound = await locals.db.select().from(table.sounds).where(inArray(table.sounds.id, soundIds))
	return json({ status: 200, data: sound })
};