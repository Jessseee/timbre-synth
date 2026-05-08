<script lang="ts">
	import {
		createSynth,
		paramNames,
		paramNamesHuman,
		type Params,
		type Synth
	} from '$lib/frontend/Synth';
	import { type Descriptor, descriptorMinMax, descriptorNames, type SynthPatch } from '$lib/frontend/Task';
	import { predictDescriptorsFromParams, predictParamsFromDescriptors } from '$lib/frontend/Predictor';
	import Card from '$lib/components/Card.svelte';
	import Sequencer from '$lib/components/Sequencer.svelte';
	import Analyser from './Analyser.svelte';

	const minMidi = 40;
	const maxMidi = 62;
	const defaultPitch = (minMidi + maxMidi) / 2;

	let {
		value = $bindable(),
		onChange
	}: {
		value: SynthPatch;
		onChange?: () => void;
	} = $props();

	let errorMsg = $state('');
	let busy = $state(false);
	let synth: Synth | undefined = $state();
	let oldSynth: Synth | undefined = $state();
	let tabIndex = $state(0);
	let updatingFrom: 'params' | 'descriptors' | null = null;
	let currentStep: number | null = $state(null);

	let mounted = false;

	$effect(() => {
		JSON.stringify(value);

		if (mounted) {
			onChange?.();
		}

		mounted = true;
	});

	async function playSound() {
		const callback = (i: number) => {
			currentStep = i;
		};

		busy = true;
		oldSynth?.dispose();

		synth = await createSynth(value.params);
		await synth.start();
		await synth.trigger(value.notes, value.pitch, callback);

		currentStep = null;
		oldSynth = synth;
		busy = false;
	}

	function setParam(param: keyof Params, next: number) {
		if (updatingFrom) return;
		updatingFrom = 'params';

		const params = {
			...value.params,
			[param]: next
		};

		try {
			value = {
				...value,
				params,
				descriptors: {
					...value.descriptors,
					...predictDescriptorsFromParams(params)
				}
			};

			errorMsg = '';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Failed to predict descriptors';
		} finally {
			updatingFrom = null;
		}
	}

	function setDescriptor(descriptor: Descriptor, next: number) {
		if (updatingFrom) return;
		updatingFrom = 'descriptors';

		const descriptors = {
			...value.descriptors,
			[descriptor]: next
		};

		try {
			value = {
				...value,
				descriptors,
				params: {
					...value.params,
					...predictParamsFromDescriptors(descriptors)
				}
			};

			errorMsg = '';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Failed to predict parameters';
		} finally {
			updatingFrom = null;
		}
	}

	function setPitch(pitch: number) {
		value = {
			...value,
			pitch
		};
	}
</script>

<div class="max-w-lg lg:max-w-4xl px-4 mx-auto flex-col xl:flex-row flex gap-4 mt-5">
	<Card collapsable={false} header="Synthesizer Settings" class="min-w-100">
		<div class="p-4 space-y-3">
			{#if errorMsg}
				<div class="bg-red-500 text-white text-center border-gray-200 p-2 rounded-xl shadow-sm mb-3">
					<p class="text-sm w-max-content">{errorMsg}</p>
				</div>
			{/if}
			<div class="text-center">
				<button
					class:bg-blue-400={tabIndex === 0}
					class:text-white={tabIndex === 0}
					class="w-50 text-blue-500 font-bold border-2 border-blue-400 m-0 hover:cursor-pointer"
					onclick={() => tabIndex = 0}
				>
					Parameters
				</button>
				<button
					class:bg-blue-400={tabIndex === 1}
					class:text-white={tabIndex === 1}
					class="w-50 text-blue-500 font-bold border-2 border-blue-400 m-0 hover:cursor-pointer"
					onclick={() => tabIndex = 1}
				>
					Timbre Descriptors
				</button>
			</div>
			<div class="h-30">
				{#if tabIndex === 0}
					{#each paramNames as param, i}
						<div class="w-full mb-1 text-center">
							<label for={param} class="text-sm text-end mr-2 w-21 inline-block">{paramNamesHuman[i]}</label>
							<input
								type="range"
								id={param}
								min="0"
								max="1"
								step="0.01"
								disabled={busy}
								value={value.params[param]}
								ondblclick={() => setParam(param, 0.5)}
								oninput={(e) => setParam(param, e.currentTarget.valueAsNumber)}
								class="h-0.5 w-50 -translate-[0.2rem] ml-1 hover:cursor-grab active:cursor-grabbing disabled:cursor-default appearance-none bg-gray-400 accent-blue-500 disabled:accent-gray-400"
							/>
						</div>
					{/each}
				{:else if tabIndex === 1}
					{#each descriptorNames as descriptor}
						<div class="w-full mb-1 text-center">
							<span class="text-sm w-10 mr-2 inline-block text-end">{descriptorMinMax[descriptor][0]}</span>
							<input
								type="range"
								id={descriptor}
								min="-2"
								max="2"
								step="0.01"
								disabled={busy}
								value={value.descriptors[descriptor]}
								ondblclick={() => setDescriptor(descriptor, 0)}
								oninput={(e) => setDescriptor(descriptor, e.currentTarget.valueAsNumber)}
								class="h-0.5 -translate-[0.2rem] ml-1 w-50 hover:cursor-grab active:cursor-grabbing disabled:cursor-default appearance-none bg-gray-400 accent-blue-500 disabled:accent-gray-400"
							/>
							<span class="text-sm w-10 mr-2 inline-block">{descriptorMinMax[descriptor][1]}</span>
						</div>
					{/each}
				{/if}
			</div>

			<Analyser analyser={synth?.analyser}/>
		</div>
	</Card>
	<Card header="Utterance" collapsable={false} class="h-full">
		<div class="p-4">
			<button
				disabled={busy}
				class="px-3 py-1 mb-4 w-full rounded-lg bg-green-500 text-white hover:cursor-pointer hover:bg-green-600 disabled:cursor-auto disabled:bg-green-300"
				onclick={playSound}
			>
				<span class="icon-[carbon--play-filled] -mb-1 text-xl text-white"></span> Play
			</button>
			<div class="flex flex-row justify-center">
				<div class="mt-2 text-center w-50 -ml-20 -mr-15">
					<span class="text-sm inline-block mb-3">pitch<br>range</span>
					<div class="flex justify-center items-center h-50">
						<input
							type="range"
							id="range"
							min={minMidi}
							max={maxMidi}
							step="1"
							disabled={busy}
							value={value.pitch}
							ondblclick={() => setPitch(defaultPitch)}
							oninput={(e) => setPitch(e.currentTarget.valueAsNumber)}
							class="h-0.5 w-100 hover:cursor-grab active:cursor-grabbing appearance-none bg-gray-400 accent-blue-500 disabled:accent-gray-400 -rotate-90"
						/>
					</div>
				</div>
				<Sequencer bind:value={value.notes} bind:currentStep pitch={value.pitch} hideBulkEditor />
			</div>
		</div>
	</Card>
</div>