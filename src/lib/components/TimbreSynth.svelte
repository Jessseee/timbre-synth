<script lang="ts">
	import {
		createSynth,
		paramNames,
		paramNamesHuman,
		type Params,
		type Synth
	} from '$lib/frontend/Synth';
	import { type Descriptor, descriptorNames, type SynthPatch } from '$lib/frontend/Task';
	import {
		predictDescriptorsFromParams,
		predictParamsFromDescriptors
	} from '$lib/frontend/Predictor';
	import Card from '$lib/components/Card.svelte';
	import Sequencer from '$lib/components/Sequencer.svelte';
	import Analyser from './Analyser.svelte';
	import * as m from '$lib/paraglide/messages';

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
	let updatingFrom: 'params' | 'descriptors' | null = null;
	let currentStep: number | null = $state(null);
	let playRunId = 0;

	let mounted = false;

	$effect(() => {
		JSON.stringify(value);

		if (mounted) {
			onChange?.();
		}

		mounted = true;
	});

	async function playSound() {
		if (busy) return;

		const runId = ++playRunId;
		const callback = (step: number | null) => {
			if (runId === playRunId) {
				currentStep = step;
			}
		};

		busy = true;
		oldSynth?.dispose();

		try {
			synth = await createSynth(value.params);
			await synth.start();
			await synth.trigger(value.notes, value.pitch, callback);

			oldSynth = synth;
			errorMsg = '';
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Failed to play sound';
		} finally {
			if (runId === playRunId) {
				currentStep = null;
			}
			busy = false;
		}
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

	function clampNumber(current: number, min: number, max: number) {
		return Math.min(max, Math.max(min, current));
	}

	function sliderPercent(current: number, min: number, max: number) {
		const percent = ((current - min) / (max - min)) * 100;
		return `${clampNumber(percent, 0, 100)}%`;
	}

	function pitchFromPointer(event: PointerEvent, target: HTMLElement) {
		const rect = target.getBoundingClientRect();
		const percent = 1 - clampNumber((event.clientY - rect.top) / rect.height, 0, 1);
		return Math.round(minMidi + percent * (maxMidi - minMidi));
	}

	function startPitchDrag(event: PointerEvent) {
		event.preventDefault();

		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		setPitch(pitchFromPointer(event, target));
	}

	function dragPitch(event: PointerEvent) {
		const target = event.currentTarget as HTMLElement;

		if (target.hasPointerCapture(event.pointerId)) {
			setPitch(pitchFromPointer(event, target));
		}
	}

	function stopPitchDrag(event: PointerEvent) {
		const target = event.currentTarget as HTMLElement;

		if (target.hasPointerCapture(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
	}

	function handlePitchKey(event: KeyboardEvent) {
		const keySteps: Record<string, number> = {
			ArrowUp: 1,
			ArrowRight: 1,
			ArrowDown: -1,
			ArrowLeft: -1,
			PageUp: 5,
			PageDown: -5
		};

		if (event.key === 'Home') {
			event.preventDefault();
			setPitch(minMidi);
			return;
		}

		if (event.key === 'End') {
			event.preventDefault();
			setPitch(maxMidi);
			return;
		}

		const step = keySteps[event.key];

		if (step) {
			event.preventDefault();
			setPitch(clampNumber(value.pitch + step, minMidi, maxMidi));
		}
	}

	function descriptorLabel(descriptor: Descriptor) {
		switch (descriptor) {
			case 'brightness':
				return [m.robots_descriptor_brightness_min(), m.robots_descriptor_brightness_max()];
			case 'resonance':
				return [m.robots_descriptor_resonance_min(), m.robots_descriptor_resonance_max()];
			case 'roughness':
				return [m.robots_descriptor_roughness_min(), m.robots_descriptor_roughness_max()];
		}
	}
</script>

<div class="w-full max-w-lg lg:max-w-4xl px-4 mx-auto flex-col lg:flex-row flex gap-4 mt-5">
	<Card header={m.robots_synth_settings()} class="lg:basis-1/2 lg:min-w-0">
		<div class="p-4 space-y-4">
			{#if errorMsg}
				<div
					class="bg-red-500 text-white text-center border-gray-200 p-2 rounded-xl shadow-sm mb-3"
				>
					<p class="text-sm w-max-content">{errorMsg}</p>
				</div>
			{/if}
			<div>
				<h2
					class="w-full max-w-90 mx-auto text-blue-500 text-center font-bold border-b-2 border-blue-400 mb-3 select-none"
				>
					{m.robots_parameters()}
				</h2>
				{#each paramNames as param, i}
					<div
						class="grid grid-cols-[4.75rem_minmax(0,1fr)_1.5rem] sm:grid-cols-[5.5rem_12.5rem_2.5rem] items-center justify-center gap-2 space-y-1 mb-1"
					>
						<label for={param} class="text-sm text-end">{paramNamesHuman[i]}</label>
						<input
							type="range"
							id={param}
							min="0"
							max="1"
							step="0.01"
							value={value.params[param]}
							style={`--value-percent: ${sliderPercent(value.params[param], 0, 1)}`}
							ondblclick={() => setParam(param, 0.5)}
							oninput={(e) => setParam(param, e.currentTarget.valueAsNumber)}
							class="robot-slider param-slider w-full hover:cursor-grab active:cursor-grabbing"
						/>
						<span aria-hidden="true"></span>
					</div>
				{/each}
			</div>
			<div>
				<h2
					class="w-full max-w-90 mx-auto text-blue-500 text-center font-bold border-b-2 border-blue-400 mb-3 select-none"
				>
					{m.robots_timbre_descriptors()}
				</h2>
				{#each descriptorNames as descriptor}
					{@const labels = descriptorLabel(descriptor)}
					<div
						class="grid grid-cols-[4.75rem_minmax(0,1fr)_2.25rem] sm:grid-cols-[5.5rem_12.5rem_2.5rem] items-center justify-center gap-2 space-y-1 mb-1"
					>
						<span class="text-sm text-end">{labels[0]}</span>
						<input
							type="range"
							id={descriptor}
							min="-2"
							max="2"
							step="0.01"
							value={value.descriptors[descriptor]}
							style={`--value-percent: ${sliderPercent(value.descriptors[descriptor], -2, 2)}`}
							ondblclick={() => setDescriptor(descriptor, 0)}
							oninput={(e) => setDescriptor(descriptor, e.currentTarget.valueAsNumber)}
							class="robot-slider descriptor-slider w-full hover:cursor-grab active:cursor-grabbing"
						/>
						<span class="text-sm text-start">{labels[1]}</span>
					</div>
				{/each}
			</div>
		</div>
		<Analyser analyser={synth?.analyser} class="rounded-b-xl" />
	</Card>
	<Card header={m.robots_utterance()} class="lg:basis-1/2 lg:min-w-0">
		<div class="p-4 h-full flex flex-col min-h-0">
			<button
				disabled={busy}
				class="group mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-800 px-4 py-2.5 font-bold text-white shadow-md shadow-cyan-500/25 transition hover:cursor-pointer hover:shadow-lg hover:shadow-cyan-500/35 disabled:cursor-auto disabled:bg-gray-400"
				onclick={playSound}
			>
				<span
					class="grid border-2 border-white place-items-center rounded-full bg-white/95 text-blue-600 group-hover:text-blue-800 shadow-sm transition group-disabled:text-gray-400"
				>
					<span class="icon-[carbon--play-filled] text-lg"></span>
				</span>
				<span class="text-base tracking-wide">{busy ? m.robots_playing() : m.robots_play()}</span>
			</button>
			<div class="flex flex-row justify-center min-w-0 min-h-0 flex-1">
				<div class="grid grid-cols-[1rem_2.5rem] grid-rows-[minmax(0,1fr)] items-stretch min-h-0">
					<div class="relative flex items-center justify-center">
						<span class="-rotate-90 whitespace-nowrap text-sm">{@html m.robots_pitch_range()}</span>
					</div>
					<div class="flex justify-center items-center min-h-0">
						<div
							class="pitch-control"
							role="slider"
							tabindex="0"
							aria-label={m.robots_pitch_range().replace('<br>', ' ')}
							aria-valuemin={minMidi}
							aria-valuemax={maxMidi}
							aria-valuenow={value.pitch}
							ondblclick={() => setPitch(defaultPitch)}
							ondragstart={(event) => event.preventDefault()}
							onpointerdown={startPitchDrag}
							onpointermove={dragPitch}
							onpointerup={stopPitchDrag}
							onpointercancel={stopPitchDrag}
							onkeydown={handlePitchKey}
						>
							<div class="pitch-track">
								<div
									class="pitch-fill"
									style={`height: ${sliderPercent(value.pitch, minMidi, maxMidi)}`}
								></div>
								<div
									class="pitch-thumb"
									style={`bottom: ${sliderPercent(value.pitch, minMidi, maxMidi)}`}
								>
									<span class="icon-[mage--music-fill] text-xs"></span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<Sequencer
					bind:value={value.notes}
					bind:currentStep
					pitch={value.pitch}
					class="h-full flex-1"
				/>
			</div>
		</div>
	</Card>
</div>

<style>
	.robot-slider {
		--value-percent: 50%;
		--fill-start: #22c55e;
		--fill-end: #06b6d4;
		--track-bg: linear-gradient(90deg, #e5e7eb, #f8fafc);
		--thumb: #2563eb;
		appearance: none;
		height: 1.35rem;
		background: transparent;
	}

	.param-slider {
		--fill-start: #22c55e;
		--fill-end: #06b6d4;
		--thumb: #0ea5e9;
	}

	.descriptor-slider {
		--fill-start: #f59e0b;
		--fill-end: #ec4899;
		--thumb: #db2777;
	}

	.robot-slider::-webkit-slider-runnable-track {
		height: 0.75rem;
		border: 2px solid white;
		border-radius: 999px;
		background:
			linear-gradient(90deg, var(--fill-start), var(--fill-end)) 0 / var(--value-percent) 100%
				no-repeat,
			var(--track-bg);
		box-shadow:
			inset 0 1px 3px rgb(15 23 42 / 0.18),
			0 1px 2px rgb(15 23 42 / 0.12);
	}

	.robot-slider::-webkit-slider-thumb {
		appearance: none;
		width: 1.45rem;
		height: 1.45rem;
		margin-top: -0.48rem;
		border: 3px solid white;
		border-radius: 999px;
		background: linear-gradient(135deg, var(--thumb), var(--fill-end));
		box-shadow:
			0 2px 6px rgb(15 23 42 / 0.28),
			0 0 0 1px rgb(15 23 42 / 0.08);
	}

	.robot-slider::-moz-range-track {
		height: 0.75rem;
		border: 2px solid white;
		border-radius: 999px;
		background: var(--track-bg);
		box-shadow:
			inset 0 1px 3px rgb(15 23 42 / 0.18),
			0 1px 2px rgb(15 23 42 / 0.12);
	}

	.robot-slider::-moz-range-progress {
		height: 0.75rem;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--fill-start), var(--fill-end));
	}

	.robot-slider::-moz-range-thumb {
		width: 1.2rem;
		height: 1.2rem;
		border: 3px solid white;
		border-radius: 999px;
		background:
			radial-gradient(circle at 35% 35%, white 0 16%, transparent 17%),
			linear-gradient(135deg, var(--thumb), var(--fill-end));
		box-shadow:
			0 2px 6px rgb(15 23 42 / 0.28),
			0 0 0 1px rgb(15 23 42 / 0.08);
	}

	.robot-slider:focus-visible {
		outline: 3px solid #93c5fd;
		outline-offset: 4px;
		border-radius: 999px;
	}

	.pitch-control {
		width: 2.5rem;
		height: 100%;
		max-height: 16rem;
		display: flex;
		align-items: center;
		justify-content: center;
		touch-action: none;
		cursor: grab;
		user-select: none;
		-webkit-user-drag: none;
	}

	.pitch-control:active {
		cursor: grabbing;
	}

	.pitch-control:focus-visible {
		outline: 3px solid #93c5fd;
		outline-offset: 4px;
		border-radius: 999px;
	}

	.pitch-track {
		position: relative;
		width: 0.85rem;
		height: 100%;
		pointer-events: none;
		border: 2px solid white;
		border-radius: 999px;
		background: linear-gradient(180deg, #f8fafc, #e5e7eb);
		box-shadow:
			inset 0 1px 3px rgb(15 23 42 / 0.18),
			0 1px 2px rgb(15 23 42 / 0.12);
	}

	.pitch-fill {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		border-radius: 999px;
		background: linear-gradient(0deg, #06b6d4, #db2757);
	}

	.pitch-thumb {
		position: absolute;
		left: 50%;
		display: grid;
		width: 1.55rem;
		height: 1.55rem;
		place-items: center;
		border: 3px solid white;
		border-radius: 999px;
		background: linear-gradient(135deg, #7c3aed, #db2757);
		color: white;
		box-shadow:
			0 2px 6px rgb(15 23 42 / 0.28),
			0 0 0 1px rgb(15 23 42 / 0.08);
		transform: translate(-50%, 50%);
		user-select: none;
		-webkit-user-drag: none;
	}
</style>
