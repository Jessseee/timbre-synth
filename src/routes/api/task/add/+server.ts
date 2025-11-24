import { table } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { hashObject } from '$lib/server/hash';

export const POST = async ({ request, locals }) => {
	try {
		const { samples, descriptor }: { samples: [{ id: string }]; descriptor: string } = await request.json();
		const taskId = await hashObject({descriptor, sounds: samples})
		await locals.db.batch([
			locals.db.insert(table.tasks).values({ id: taskId, descriptor }),
			locals.db.insert(table.taskSounds).values(
				samples.map(({ id: soundId }) => ({
					taskId,
					soundId
				}))
			)
		]);
	} catch (e) {
		console.error(e);
		error(500, 'Failed to add task.');
	}
	return json({ status: 200 });
};
