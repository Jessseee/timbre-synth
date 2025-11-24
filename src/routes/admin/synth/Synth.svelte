<script lang="ts">
	import * as Tone from 'tone';
	import audioBufferToWav from 'audiobuffer-to-wav';
	import {
		createSynth,
		makeParamSets,
		paramNames,
		type Params,
		type MidiItem,
		type Sample,
		type Synth,
		parseParams
	} from '$lib/frontend/Synth';

	interface Props {
		notes: MidiItem[];
		callback?: (sample: Sample) => void;
	}
	let { notes = $bindable(), callback = undefined }: Props = $props();

	let errorMsg = $state('');
	let paramSets: Params[];
	let params: Params = $state(getNewParams());
	let toRender: HTMLInputElement;
	let busy = $state(false);
	let oldSynth: Synth;

	function getNewParams() {
		paramSets = paramSets ?? makeParamSets(1000, Math.floor(Math.random() * 1000));
		let p = paramSets.pop()!;
		if (p === undefined) getNewParams();
		return p;
	}

	async function playSound() {
		oldSynth?.dispose();
		const synth = await createSynth(params);
		await synth.start();
		synth.trigger(notes);
		oldSynth = synth;
	}

	async function renderSounds() {
		busy = true;
		while (parseInt(toRender.value) > 0) {
			await renderSound();
			toRender.value = (parseInt(toRender.value) - 1).toString();
		}
		toRender.value = '1';
		busy = false;
	}

	async function renderSound() {
		errorMsg = '';
		const duration =
			(notes.reduce((total, item) => total + Math.max(0, item.dur), 0) || 1) +
			parseParams(params).release;

		const buffer = await Tone.Offline(async () => {
			const synth = await createSynth(params);
			await synth.start();
			synth.trigger(notes);
		}, duration);

		// @ts-ignore
		const wav = audioBufferToWav(buffer);
		const b64 = Array.from(new Uint8Array(wav));

		await fetch('/api/sound', { method: 'POST', body: JSON.stringify({ params, notes, b64 }) })
			.then(async (res) => {
				if (!res.ok) throw new Error(res.statusText);
				const { id } = await res.json();
				callback?.({ id, params, notes });
				params = getNewParams();
			})
			.catch((e) => {
				errorMsg = e?.body ?? String(e);
			});
	}
</script>

<div class="flex-col">
	{#if errorMsg}
		<div class="bg-red-500 text-white text-center border-gray-200 p-2 rounded-xl shadow-sm mb-3">
			<p class="text-sm w-max-content">{errorMsg}</p>
		</div>
	{/if}
	{#each paramNames as paramName}
		<div class="w-full mb-1">
			<label for={paramName} class="text-sm w-20 inline-block">{paramName}</label>
			<input
				type="range"
				id={paramName}
				min="0"
				max="1"
				step="0.01"
				class="h-[2px] w-50 cursor-default appearance-none bg-gray-400 accent-blue-500"
				bind:value={params[paramName]}
			/>
			<span class="text-xs ml-1">
				{params[paramName].toFixed(2)}
			</span>
		</div>
	{/each}

	<div class="mt-2 flex justify-end">
		<input
			class="border-1 border-gray-200 rounded-lg mr-2 w-20 pl-2"
			type="number"
			bind:this={toRender}
			value="1"
		/>
		<button
			disabled={busy}
			class="px-7 py-1 mr-2 rounded-lg bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-700 disabled:cursor-auto disabled:bg-blue-300"
			onclick={renderSounds}
		>
			Add Sound(s)
		</button>
		<button
			disabled={busy}
			class="px-3 py-1 rounded-lg bg-green-500 text-white hover:cursor-pointer hover:bg-green-700 disabled:cursor-auto disabled:bg-green-300"
			onclick={playSound}
		>
			<span class="icon-[carbon--play-filled-alt] -mb-0.5 text-white"></span>
		</button>
	</div>
</div>
