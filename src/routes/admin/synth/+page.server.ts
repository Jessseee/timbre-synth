import { table } from '$lib/server/db';
import path from 'node:path';
import { rm } from 'node:fs/promises';

export const load = async ({ locals }) => {
	const samples = await locals.db.select().from(table.sounds);

	return {
		samples
	};
};

export const actions = {
	clearSounds: async ({ locals, platform }) => {
		const deletedSounds = await locals.db.delete(table.sounds).returning();

		if (platform?.env.R2) {
			await platform.env.R2.delete(deletedSounds.map(({ id }) => `${id}.wav`));
		} else {
			await rm(path.resolve('./storage/sounds'), { recursive: true, force: true });
		}
	}
};
