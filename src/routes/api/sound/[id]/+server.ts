import { table } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import path from 'node:path';
import { readFile, unlink } from 'node:fs/promises';

const storageDir = path.resolve('./storage/sounds');

export const GET = async ({ params, locals }) => {
		const sound = await locals.db.select().from(table.sounds).where(eq(table.sounds.id, params.id))
		return json({ status: 200, data: sound })
};

export const DELETE = async ({ params, locals, platform }) => {
	try {
		await locals.db.delete(table.sounds).where(eq(table.sounds.id, params.id));
	} catch {
		error(500, 'Failed to delete sound.');
	}

	const filename = `${params.id}.wav`;
	if (platform?.env.R2) {
		await platform.env.R2.delete(filename);
	} else {
		const fullPath = path.join(storageDir, filename);
		if (!path.resolve(fullPath).startsWith(storageDir)) {
			error(500, 'Failed to delete sound file.');
		}
		await unlink(filename);
	}

	return json({ status: 200 });
};
