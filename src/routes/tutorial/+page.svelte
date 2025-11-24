<script lang="ts">
	import Annotator from '$lib/components/Annotator.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { type DndEvent, dndzone } from 'svelte-dnd-action';

	const { data, form } = $props();
	/* svelte-ignore state_referenced_locally */
	let sounds = $state(data.tasks[0].sounds.slice(0, 2));
	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let curSoundId = $state();

	function handleDragAndDrop({ detail }: CustomEvent<DndEvent<{ id: number; sound: string }>>) {
		sounds = detail.items;
	}

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
		curSoundId = src.split('/').at(-1);
		audio.src = src;
		audio.currentTime = 0;
		return audio.play();
	}
</script>

<svelte:head>
	<title>Timbre Thesis - Tutorial</title>
</svelte:head>

<Annotator {form} initTasks={data.tasks}>
	<h3 class="font-bold text-xl mb-1">Tutorial</h3>
	<p>
		As mentioned before, you will be ranking sounds by timbre descriptors (brightness, roughness and
		resonance). This involves listening to each sound and arranging them from most representative
		(top <span class="icon-[carbon--arrow-up] text-sm -mb-0.5"></span>) to least representative
		(bottom <span class="icon-[carbon--arrow-down] text-sm -mb-0.5"></span>) of the descriptor. You
		may listen to each sound as many times as is necessary to determine a good ranking.
	</p>

	<p>
		First we would like you to complete a short tutorial where you rank one set of sounds for each
		descriptor after that you will get the rest of your assigned tasks.
	</p>

	<h3 class="font-bold text-xl mt-4 mb-1">Example</h3>
	<p>The items in an annotation task look like this:</p>
	<div
		use:dndzone={{
			items: sounds,
			flipDurationMs: 150,
			dropTargetStyle: { border: 'none' }
		}}
		onconsider={handleDragAndDrop}
		onfinalize={handleDragAndDrop}
		class="space-y-2"
	>
		{#each sounds as { id, sound } (id)}
			<div
				class="flex items-center justify-between rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 hover:cursor-grab"
			>
				<AudioPlayer bind:playing bind:curId={curSoundId} src={`/sound/${sound}`} {playSound} />
				<p class="font-light text-center">sound {id + 1}</p>
				<span class="icon-[carbon--drag-vertical] text-xl"></span>
			</div>
		{/each}
	</div>

	<p>
		You can rearrange the items by dragging them from top to bottom (press and hold left mouse
		button while moving the mouse).
	</p>

	<p>
		You can play the sound by pressing the play button (<span
			class="icon-[carbon--play-filled-alt] -mb-1 ml-0.5 text-gray-900"
		></span>).
	</p>

	<p class="text-sm p-3 bg-gray-100 rounded">
		<b>Note!</b> The timbre descriptor you need to use for ranking changes between tasks. This is indicated
		by the colored navigation items and the explanation text, which update from one task to the next.
		Be sure you are ranking the sounds using the correct timbre descriptor for the current task.
	</p>

	<p>Thank you for participating!</p>
</Annotator>
