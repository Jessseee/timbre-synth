import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { paramNames, type Params, type MidiItem } from '$lib/frontend/Synth';
import { descriptorNames, type Descriptor, type SynthPatch } from '$lib/frontend/Task';
import { predictDescriptorsFromParams } from '$lib/frontend/Predictor';
import { validateTurnstileClientToken } from '$lib/server/turnstile';
import robots from "./robots.json"
import { and, eq } from 'drizzle-orm';

const minMidi = 40;
const maxMidi = 62;
const defaultPitch = (minMidi + maxMidi) / 2;

function createDefaultParams(): Params {
	return paramNames.reduce((acc, param) => {
		acc[param] = 0.5;
		return acc;
	}, {} as Params);
}

function createDefaultDescriptors(params: Params): Record<Descriptor, number> {
	try {
		return predictDescriptorsFromParams(params);
	} catch {
		return descriptorNames.reduce(
			(acc, descriptor) => {
				acc[descriptor] = 0;
				return acc;
			},
			{} as Record<Descriptor, number>
		);
	}
}

function createDefaultSynthPatch(): SynthPatch {
	const params = createDefaultParams();

	return {
		params,
		descriptors: createDefaultDescriptors(params),
		pitch: defaultPitch,
		notes: [
			{ note: 2, dur: 0.2 },
			{ note: 8, dur: 0.2 }
		]
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	return {
		tasks: await Promise.all(
			robots.map(async (robot) => {
				const annotation = await locals.db.query.annotations.findFirst({
					where: ({ annotatorId, taskId }) =>
						and(eq(annotatorId, locals.session!.id), eq(taskId, robot.id))
				});
				return {
					id: robot.id,
					robot,
					sound: (annotation?.data.sound as SynthPatch) ?? createDefaultSynthPatch(),
					soundId: annotation?.data.soundId
				};
			})
		),
		sessionId: locals.session!.id
	};
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const token = data.get('cf-turnstile-token')?.toString();
		if (!token) return fail(500, { error: 'Did not pass client-side verification.' });
		if (!(await validateTurnstileClientToken(token, fetch))) {
			return fail(500, { error: 'Did not pass server-side verification.' });
		}

		const tasks = JSON.parse(data.get('tasks')!.toString());
		await fetch('/annotation/robots', {
			method: 'POST',
			body: JSON.stringify({
				tasks,
				status: 'done'
			})
		});

		return redirect(303, 'robots/done');
	}
};
