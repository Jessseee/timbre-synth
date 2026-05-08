import { readFile } from 'node:fs/promises';
import { error} from '@sveltejs/kit';
import path from 'node:path';

export const GET = async ({ params, platform }) => {
	const filename = `${params.id}.wav`;
	if (platform?.env.R2) {
		const file = await platform.env.R2.get(filename);
		if (!file) return error(404);
		return new Response(file.body, {
			headers: { 'Content-Type': 'audio/wav' }
		});
	} else {
		const root = path.resolve('./storage/sounds');
		const fullPath = path.join(root, filename);
		if (!path.resolve(fullPath).startsWith(root)) return error(404);
		const data = await readFile(fullPath);
		return new Response(Buffer.from(data), {
			headers: { 'Content-Type': 'audio/wav' }
		});
	}
};
