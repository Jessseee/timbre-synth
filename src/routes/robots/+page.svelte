<script lang="ts">
	import MultiPageForm from '$lib/components/MultiPageForm.svelte';
	import TimbreSynth from './TimbreSynth.svelte';
	import type { RobotTask } from '$lib/frontend/Task';
	import { createSynth, parseParams } from '$lib/frontend/Synth';
	import * as Tone from 'tone';
	import audioBufferToWav from 'audiobuffer-to-wav';

	let {
		data,
		form
	}: {
		data: {tasks: RobotTask[], sessionId: string};
		form?: { error?: string };
	} = $props();

	async function renderSound({ sound }: RobotTask): Promise<string> {
		const { notes, params, pitch } = sound;
		const duration =
			(notes.reduce((total, item) => total + Math.max(0, item.dur), 0) || 1) +
			parseParams(params).release;

		const buffer = await Tone.Offline(async () => {
			const synth = await createSynth(params);
			await synth.start();
			await synth.trigger(notes);
		}, duration);

		// @ts-ignore
		const wav = audioBufferToWav(buffer);
		const b64 = Array.from(new Uint8Array(wav));

		return await fetch('/sound', { method: 'POST', body: JSON.stringify({ params, notes, pitch, b64 }) })
			.then(async (res) => {
				if (!res.ok) throw new Error(res.statusText);
				const { id }: { id: string } = await res.json();
				return id
			})
	}

	async function renderSounds({formData, tasks}: {formData: FormData, tasks: RobotTask[]}) {
		formData.set('tasks', JSON.stringify(await Promise.all(
			tasks.map(async (task) => {
				const soundId = await renderSound(task)
				task.sound = {...task.sound}
				return {...task, soundId: soundId}
			})
		)))
		return formData
	}
</script>

<MultiPageForm {form} initTasks={data.tasks} endpoint="/annotation/robots" buildSubmitFormData={renderSounds}>
	{#snippet instructions({ task })}
		<img
			src={task.robot.imageUrl}
			alt={task.robot.name}
			class="rounded-xl shadow-sm ring-1 ring-gray-200"
		/>
		<div class="bg-gray-100 p-4 rounded-xl shadow-sm ring-1 ring-gray-200">
			<h3 class="font-bold text-lg mb-2">{task.robot.name}</h3>
			<p class="max-w-md">{task.robot.description}</p>
		</div>
		<div class="bg-orange-100 p-4 rounded-xl shadow-sm ring-1 ring-gray-200">
			<p>Create an <b>attention grabbing</b> sound to alert a nearby person that the robot wants to physically pass by them.</p>
		</div>
	{/snippet}

	{#snippet annotation({ task, taskId, markChanged })}
		{#key taskId}
			<TimbreSynth bind:value={task.sound} onChange={markChanged} />
		{/key}
	{/snippet}
</MultiPageForm>
<p class="text-end -mt-5 xl:mt-2 mb-1 mr-3 text-gray-300 text-sm">{data.sessionId.slice(-10, -1)}</p>