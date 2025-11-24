<script lang="ts">
	import { enhance } from '$app/forms';
	import { type DndEvent, dndzone } from 'svelte-dnd-action';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { turnstile } from '@svelte-put/cloudflare-turnstile';

	let token = $state('');

	let { initTasks, form, children = undefined } = $props();

	/* svelte-ignore state_referenced_locally */
	let started = $state(children === undefined);
	/* svelte-ignore state_referenced_locally */
	let tasks = $state(initTasks);

	let curTaskId = $state(0);
	let latestTaskId = $state(0)
	let curTask = $derived(tasks[curTaskId]);
	let sounds = $derived(curTask.sounds);
	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let curSoundId = $state();
	let hasMovedSound = $state(false);

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

	function stopSound() {
		audio?.pause();
		curSoundId = null;
		playing = false;
	}

	function handleDragAndDrop({ detail }: CustomEvent<DndEvent<{ id: number; sound: string }>>) {
		hasMovedSound = true
		const { items } = detail;
		if (tasks) {
			tasks[curTaskId].sounds = items;
		}
	}

	async function updateOrCreateAnnotation(taskId: number) {
		await fetch('/annotation', {
			method: 'POST',
			body: JSON.stringify({
				tasks: [tasks[taskId]],
				status: 'pending'
			})
		});
	}

	async function nextTask() {
		await updateOrCreateAnnotation(curTaskId);
		curTaskId = curTaskId + 1;
		if (curTaskId >= latestTaskId) hasMovedSound = false;
		latestTaskId = Math.max(latestTaskId, curTaskId);
		stopSound();
	}

	async function previousTask() {
		hasMovedSound = true;
		await updateOrCreateAnnotation(curTaskId)
		curTaskId = Math.max(0, curTaskId - 1);
		stopSound();
	}
</script>

<div class="flex flex-wrap p-5">
	<div
		class="max-w-md mx-auto lg:h-[calc(100vh-2em)] max-h-full overflow-y-auto lg:mr-5 p-4 space-y-2"
	>
		{#if !started}
			{@render children()}
			<button
				onclick={() => (started = true)}
				class="rounded bg-blue-500 text-white px-4 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
			>
				Continue
			</button>
		{:else if curTask.descriptor === 'brightness'}
			<h3 class="font-bold text-xl mb-1">Bright / Dull</h3>
			<p>
				Rank the sounds from <b>bright</b> (<span class="icon-[carbon--arrow-up] text-sm -mb-0.5"
				></span>) to <b>dull</b> (<span class="icon-[carbon--arrow-down] text-sm -mb-0.5"></span>)
			</p>
			<h4 class="text-lg">Bright</h4>
			<p>A sound also described as sharp.</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/BrilliantSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example Bright Sound</p>
			</div>
			<h4 class="text-lg">Dull</h4>
			<p>A sound also described as muffled.</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/MatSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example dull sound</p>
			</div>
			<p class="text-xs text-gray-400 mt-5">
				Source: <a
					class="underline hover:text-blue-400"
					href="https://speak.ircam.fr/en/lexique/lexique-ircam/mat-brillant/"
					>https://speak.ircam.fr/en/</a
				>
			</p>
		{:else if curTask.descriptor === 'roughness'}
			<h3 class="font-bold text-xl mb-1">Rough / Smooth</h3>
			<p>
				Rank the sounds from <b>rough</b> (<span class="icon-[carbon--arrow-up] text-sm -mb-0.5"
				></span>) to <b>smooth</b> (<span class="icon-[carbon--arrow-down] text-sm -mb-0.5"></span>)
			</p>
			<h4 class="text-lg">Rough</h4>
			<p>
				A sound qualified as having a raspy or granular texture.
			</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/RugeuxSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example Rough Sound</p>
			</div>
			<h4 class="text-lg">Smooth</h4>
			<p>A sound with an absense of texture, qualified as not producing a rubbing sensation.</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/LisseSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example Smooth Sound</p>
			</div>
			<p class="text-xs text-gray-400 mt-5">
				Source: <a
					class="underline hover:text-blue-400"
					href="https://speak.ircam.fr/en/lexique/lexique-ircam/rugueux-lisse/"
					>https://speak.ircam.fr/en/</a
				>
			</p>
		{:else if curTask.descriptor === 'resonance'}
			<h3 class="font-bold text-xl mb-1">Resonant / Dry</h3>
			<p>
				Rank the sounds from <b>resonant</b> (<span class="icon-[carbon--arrow-up] text-sm -mb-0.5"
				></span>) to <b>dry</b> (<span class="icon-[carbon--arrow-down] text-sm -mb-0.5"></span>)
			</p>
			<h4 class="text-lg">Resonant</h4>
			<p>
				A sound which energy dissipates progressively.
			</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/ResonnantSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example Resonant Sound</p>
			</div>
			<h4 class="text-lg">Dry</h4>
			<p>A sound which stops abruptly.</p>
			<div
				class="flex space-x-3 items-center rounded-xl bg-gray-100 shadow-sm ring-1 ring-gray-200 p-2 pr-5 w-max"
			>
				<AudioPlayer
					bind:playing
					bind:curId={curSoundId}
					src="/sounds/SecSynth.wav"
					{playSound}
					{stopSound}
				/>
				<p>Example Dry Sound</p>
			</div>
			<p class="text-xs text-gray-400 mt-5">
				Source: <a
					class="underline hover:text-blue-400"
					href="https://speak.ircam.fr/en/lexique/lexique-ircam/sec-resonnant/"
					>https://speak.ircam.fr/en/</a
				>
			</p>
		{/if}
	</div>
	<div class="w-md mx-auto lg:ml-5 p-4 space-y-4 flex flex-col">
		{#if started}
			<h2 class="text-xl font-bold -mb-2">Task {curTaskId + 1}/{tasks.length}</h2>
			<h3 class="text-lg font-bold text-center mb-0">
				{curTask.descriptor === 'brightness'
					? 'Bright'
					: curTask.descriptor === 'resonance'
						? 'Resonant'
						: curTask.descriptor === 'roughness'
							? 'Rough'
							: null}
			</h3>
			<hr class="mt-1 text-gray-200" />
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
				{curTask.descriptor === 'brightness'
					? 'Dull'
					: curTask.descriptor === 'resonance'
						? 'Dry'
						: curTask.descriptor === 'roughness'
							? 'Smooth'
							: null}
			</h3>
			<div class="flex flex-col items-center">
				<div class="flex space-x-2 w-full">
					<button
						disabled={curTaskId === 0}
						onclick={previousTask}
						class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
					>
						<span class="icon-[carbon--previous-filled] text-lg -mb-1"></span> Previous
					</button>
					{#if curTaskId < tasks.length - 1}
						<button
							disabled={curTaskId >= tasks.length || !hasMovedSound}
							onclick={nextTask}
							class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
						>
							Next <span class="icon-[carbon--next-filled] text-lg -mb-1"></span>
						</button>
					{:else}
						<form
							class="w-full"
							method="POST"
							use:enhance={({ formData }) => {
								formData.append('tasks', JSON.stringify(tasks));
								formData.append('cf-turnstile-token', token);
							}}
						>
							<div
								use:turnstile
								turnstile-sitekey="0x4AAAAAACES3HfA41jmS6z1"
								onturnstile={(e) => (token = e.detail.token)}
							></div>
							<button
								disabled={token === '' || !hasMovedSound}
								type="submit"
								class="bg-green-500 p-2 py-1 rounded text-white font-bold hover:cursor-pointer hover:bg-green-600 w-full disabled:bg-green-300 disabled:cursor-default"
							>
								{@html token
									? 'Submit <span class="icon-[carbon--checkmark-filled] -mb-0.5"></span>'
									: 'Verifying...'}
							</button>
						</form>
					{/if}
				</div>
				{#if form?.error}
					<p class="text-sm p-3 bg-red-100 rounded"><b class="mr-1">Error!</b> {form.error}</p>
				{/if}
				<div class="flex space-x-5 my-4">
					{#each tasks as task, taskId (taskId)}
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
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
