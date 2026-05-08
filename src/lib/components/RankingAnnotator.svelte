<script lang="ts">
	import { type DndEvent, dndzone } from 'svelte-dnd-action';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import MultiPageForm from '$lib/components/MultiPageForm.svelte';
	import { descriptorMinMax, type Descriptor } from '$lib/frontend/Task';
	import type { Snippet } from 'svelte';

	type DescriptorCopy = typeof descriptorCopy;
	type DescriptorCopyItem = DescriptorCopy[Descriptor];

	type SoundItem = {
		id: number;
		sound: string;
	};

	type RankingTask = {
		descriptor: Descriptor;
		sounds: SoundItem[];
	};

	let {
		initTasks,
		form,
		children = undefined
	}: {
		initTasks: RankingTask[];
		form?: { error?: string } | null;
		children?: Snippet;
	} = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let curSoundId: string | null = $state(null);

	const descriptorCopy = {
		brightness: {
			title: 'Bright / Dull',
			high: 'bright',
			low: 'dull',
			highTitle: 'Bright',
			highDescription: 'A sound also described as sharp.',
			highExampleSrc: '/sounds/BrilliantSynth.wav',
			highExampleLabel: 'Example Bright Sound',
			lowTitle: 'Dull',
			lowDescription: 'A sound also described as muffled.',
			lowExampleSrc: '/sounds/MatSynth.wav',
			lowExampleLabel: 'Example dull sound',
			source: 'https://speak.ircam.fr/en/lexique/lexique-ircam/mat-brillant/'
		},
		roughness: {
			title: 'Rough / Smooth',
			high: 'rough',
			low: 'smooth',
			highTitle: 'Rough',
			highDescription: 'A sound qualified as having a raspy or granular texture.',
			highExampleSrc: '/sounds/RugeuxSynth.wav',
			highExampleLabel: 'Example Rough Sound',
			lowTitle: 'Smooth',
			lowDescription:
				'A sound with an absence of texture, qualified as not producing a rubbing sensation.',
			lowExampleSrc: '/sounds/LisseSynth.wav',
			lowExampleLabel: 'Example Smooth Sound',
			source: 'https://speak.ircam.fr/en/lexique/lexique-ircam/rugueux-lisse/'
		},
		resonance: {
			title: 'Resonant / Dry',
			high: 'resonant',
			low: 'dry',
			highTitle: 'Resonant',
			highDescription: 'A sound which energy dissipates progressively.',
			highExampleSrc: '/sounds/ResonnantSynth.wav',
			highExampleLabel: 'Example Resonant Sound',
			lowTitle: 'Dry',
			lowDescription: 'A sound which stops abruptly.',
			lowExampleSrc: '/sounds/SecSynth.wav',
			lowExampleLabel: 'Example Dry Sound',
			source: 'https://speak.ircam.fr/en/lexique/lexique-ircam/sec-resonnant/'
		}
	} satisfies Record<Descriptor, Record<string, string>>;

	function playSound(src: string) {
		if (!audio) {
			audio = new Audio();

			audio.onended = () => {
				playing = false;
				curSoundId = null;
			};

			audio.onplay = () => {
				playing = true;
			};
		}

		if (playing) return;

		curSoundId = src.split('/').at(-1) ?? null;
		audio.src = src;
		audio.currentTime = 0;

		return audio.play();
	}

	function stopSound() {
		audio?.pause();
		curSoundId = null;
		playing = false;
	}

	function handleDragAndDrop(
		taskId: number,
		tasks: RankingTask[],
		markChanged: () => void,
		{ detail }: CustomEvent<DndEvent<SoundItem>>
	) {
		markChanged();
		tasks[taskId].sounds = detail.items;
	}

	const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
</script>

<MultiPageForm {initTasks} {form} endpoint="/annotation/ranking" intro={children} onPageLeave={stopSound}>
	{#snippet instructions({ task })}
		{@const copy: DescriptorCopyItem = descriptorCopy[task.descriptor]}

		<h3 class="font-bold text-xl mb-1">{copy.title}</h3>

		<p>
			Rank the sounds from <b>{copy.high}</b>
			(<span class="icon-[carbon--arrow-up] text-sm -mb-0.5"></span>)
			to <b>{copy.low}</b>
			(<span class="icon-[carbon--arrow-down] text-sm -mb-0.5"></span>)
		</p>

		<h4 class="text-lg">{copy.highTitle}</h4>
		<p>{copy.highDescription}</p>

		<div
			class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
		>
			<AudioPlayer
				bind:playing
				bind:curId={curSoundId}
				src={copy.highExampleSrc}
				{playSound}
				{stopSound}
			/>
			<p>{copy.highExampleLabel}</p>
		</div>

		<h4 class="text-lg">{copy.lowTitle}</h4>
		<p>{copy.lowDescription}</p>

		<div
			class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
		>
			<AudioPlayer
				bind:playing
				bind:curId={curSoundId}
				src={copy.lowExampleSrc}
				{playSound}
				{stopSound}
			/>
			<p>{copy.lowExampleLabel}</p>
		</div>

		<p class="text-xs text-gray-400 mt-5">
			Source:
			<a class="underline hover:text-blue-400" href={copy.source}>https://speak.ircam.fr/en/</a>
		</p>
	{/snippet}

	{#snippet annotation({ task, taskId, tasks, markChanged })}
		<h3 class="text-lg font-bold text-center mb-0">
			{capitalize(descriptorMinMax[task.descriptor][1])}
		</h3>

		<hr class="mt-1 text-gray-200" />

		<div
			use:dndzone={{
				items: task.sounds,
				flipDurationMs: 150,
				dropTargetStyle: { border: 'none' }
			}}
			onconsider={(event) =>
				handleDragAndDrop(
					taskId,
					tasks,
					markChanged,
					event as CustomEvent<DndEvent<SoundItem>>
				)}
			onfinalize={(event) =>
				handleDragAndDrop(
					taskId,
					tasks,
					markChanged,
					event as CustomEvent<DndEvent<SoundItem>>
				)}
			class="space-y-2"
		>
			{#each task.sounds as { id, sound } (id)}
				<div
					class="flex items-center justify-between rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2"
				>
					<AudioPlayer
						bind:playing
						bind:curId={curSoundId}
						src={`/sound/${sound}`}
						{playSound}
					/>

					<p class="font-light text-center">sound {id + 1}</p>
					<span class="icon-[carbon--drag-vertical] text-xl"></span>
				</div>
			{/each}
		</div>

		<hr class="mb-1 text-gray-200" />

		<h3 class="text-lg font-bold text-center">
			{capitalize(descriptorMinMax[task.descriptor][0])}
		</h3>
	{/snippet}

	{#snippet progressDot({ task, taskId, curTaskId })}
		{#if task.descriptor === 'brightness'}
			<div
				class:bg-green-700={curTaskId >= taskId}
				class="w-[.5em] h-[.5em] shadow-sm ring-2 ring-green-700 rounded"
			></div>
		{:else if task.descriptor === 'roughness'}
			<div
				class:bg-purple-700={curTaskId >= taskId}
				class="w-[.5em] h-[.5em] shadow-sm ring-2 ring-purple-700 rounded"
			></div>
		{:else if task.descriptor === 'resonance'}
			<div
				class:bg-red-700={curTaskId >= taskId}
				class="w-[.5em] h-[.5em] shadow-sm ring-2 ring-red-700 rounded"
			></div>
		{/if}
	{/snippet}
</MultiPageForm>