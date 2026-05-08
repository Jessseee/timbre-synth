import type { MidiItem, Params } from '$lib/frontend/Synth';
import { hashObject } from '$lib/server/hash';
import { table } from '$lib/server/db';
import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';

export const POST = async ({ request, locals, platform }) => {
	let { params, notes, pitch, b64 }: { params: Params; notes: MidiItem[]; pitch?: number; b64: string } =
		await request.json();
	if (pitch !== undefined) {
		notes = notes.map((note) => ({...note, note: (note.note !== null ? note.note + pitch : null)}))
	}

	const buf = Buffer.from(b64, 'base64');
	const id = await hashObject({params, notes});
	const exists = await locals.db.query.sounds.findFirst(
		{ where: ({ id: soundId }) => eq(soundId, id) }
	) !== undefined
	if (exists) {
		return json({ id, params, notes, message: "sound exists" }, { status: 200 })
	}
	try {
		await locals.db.insert(table.sounds).values({ id, params, notes });
	} catch (err) {
		console.error(err)
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
		console.error(err);
		error(500, 'Failed to create sound.');
	}
	return json({ id, params, notes }, { status: 200 });
};