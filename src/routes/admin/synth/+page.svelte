<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PCA } from 'ml-pca';
	import { SvelteSet } from 'svelte/reactivity';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import Synth from './Synth.svelte';
	import Card from '$lib/components/Card.svelte';
	import { paramNames, type Sample, type MidiItem } from '$lib/frontend/Synth';
	import type { PageProps } from './$types';
	import MidiList from './MidiList.svelte';
	import ButtonWithConfirmPrompt from '$lib/components/ButtonWithConfirmPrompt.svelte';

	let { data }: PageProps = $props();

	/* svelte-ignore state_referenced_locally */
	let samples = $state(data.samples);

	let nSamples = $derived(samples.length);
	let pcaKeys: SvelteSet<string> = $state(new SvelteSet());
	let colorKeys: SvelteSet<string> = $state(new SvelteSet());

	let coords: number[][] = $state([]);
	let selected: Sample | null = $state(null);
	let hover: Sample | null = $state(null);
	let audio: HTMLAudioElement;

	let CreateAnnotationTasksBtn: HTMLButtonElement | undefined = $state();

	let notes: MidiItem[] = $state([
		{ midi: 52, dur: 0.2 },
		{ midi: 58, dur: 0.2 }
	]);

	let errorMsg = $state('');

	const pad = 40;
	const aspect = 3 / 2;
	let container: HTMLDivElement;
	let width = $state(0);
	let height = $state(0);
	let ro: ResizeObserver;

	let selectedList: Array<[string, number]> = $state([]);

	const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
	const xPx = (t: number) => pad + clamp01(t) * (width - 2 * pad);
	const yPx = (t: number) => height - pad - clamp01(t) * (height - 2 * pad);

	function minMaxScale2D(raw: number[][]): number[][] {
		if (!raw.length) return raw;
		let minX = Infinity,
			maxX = -Infinity,
			minY = Infinity,
			maxY = -Infinity;
		for (const [x, y] of raw) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		const sx = maxX === minX ? 1 : maxX - minX;
		const sy = maxY === minY ? 1 : maxY - minY;
		return raw.map(([x, y]) => [(x - minX) / sx, (y - minY) / sy]);
	}

	function colorFor(d: Sample, colorKeys?: SvelteSet<string>): string {
		if (!colorKeys || colorKeys.size === 0) {
			return 'hsl(220 10% 35%)';
		}

		let sum = 0;
		let count = 0;
		for (const key of colorKeys) {
			const v = d.params[key];
			sum += clamp01(v ?? 0.5);
			count++;
		}

		const t = clamp01(sum / count);
		const hue = 240 - 240 * t;
		const light = 45 + 25 * (0.5 - Math.abs(t - 0.5));

		return `hsl(${hue} 70% ${light}%)`;
	}

	async function computePCA() {
		errorMsg = '';
		coords = [];
		if (!samples.length) return;

		colorKeys = pcaKeys;

		const keys = Array.from(pcaKeys);
		if (!keys.length) {
			errorMsg = 'Select at least one parameter to include in PCA.';
			return;
		}

		try {
			const X = samples.map((s: Sample) => keys.map((k) => clamp01(s.params[k] ?? 0)));
			const pca = new PCA(X, { center: true, scale: false });
			const Y = pca.predict(X);
			const arr: number[][] = Y.to2DArray();
			const raw2 = arr.map((row) => [row[0] ?? 0, row[1] ?? 0]);
			coords = minMaxScale2D(raw2);
		} catch (e: any) {
			errorMsg = e?.body ?? String(e);
		}
	}

	async function updateSize() {
		if (!container) return;
		const w = container.clientWidth;
		width = w;
		height = Math.max(280, Math.round(w / aspect));
		await computePCA();
	}

	function playSample(sample: Sample) {
		if (!audio) audio = new Audio();
		audio.src = `/api/sound/${sample.id}`;
		audio.currentTime = 0;
		audio.play();
	}

	async function deleteSound(id?: string) {
		if (id) {
			await fetch(`/api/sound/${id}`, { method: 'DELETE' });
			samples = samples.filter((s: Sample) => s.id !== id);
		} else {
			await fetch('/api/sound', { method: 'DELETE' });
			samples = [];
		}
		selected = null;
		await computePCA();
	}

	function selectSample(sample: Sample) {
		playSample(sample);
		selected = sample;
	}

	async function synthCallback(sample: Sample) {
		if (samples.some((s: Sample) => s.id === sample.id)) return;
		samples.push(sample);
		selected = sample;
		samples = samples
		await computePCA();
	}

	function confirmSubmit(button: HTMLButtonElement | undefined) {
		if (button === undefined) return;
		const originalText = button.innerText;
		const originalWidth = button.style.width;
		button.disabled = true;
		button.style.width = button.clientWidth + 'px';
		button.innerText = '✓';
		setTimeout(() => {
			button.disabled = false;
			button.innerText = originalText;
			button.style.width = originalWidth;
		}, 600);
	}

	$effect(() => {
		selectedList = selected
			? Object.entries(selected.params).sort((a, b) => a[0].localeCompare(b[0]))
			: [];
	});

	async function createAnnotationTasks() {
		await fetch('/api/task', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ samples })
		});
		confirmSubmit(CreateAnnotationTasksBtn);
	}

	onMount(async () => {
		if (samples.length) {
			const set = new SvelteSet<string>();
			for (const s of samples) Object.keys(s.params).forEach((k) => set.add(k));
			pcaKeys = new SvelteSet(paramNames);
			colorKeys = new SvelteSet([paramNames[0]]);
		}

		ro = new ResizeObserver(() => updateSize());
		ro.observe(container);

		audio = new Audio();
		await computePCA();
	});

	onDestroy(() => {
		ro?.disconnect();
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-5">
	<div bind:this={container} class="relative max-h-[90vh] aspect-[3/2] border-1 border-[#eee]">
		<p class="text-xs absolute left-[1em] bottom-[1em]">samples: {nSamples}</p>
		{#if selected}
			<div class="absolute right-0 border-gray-200 space-y-2">
				<div class="overflow-auto border border-gray-100">
					<table class="w-full text-xs">
						<thead class="bg-gray-50 sticky top-0">
							<tr>
								<th class="text-left px-2 py-1 font-medium text-gray-600">Parameter</th>
								<th class="text-right px-2 py-1 font-medium text-gray-600">Value</th>
								<th class="px-2 py-1 font-medium text-gray-600">Level</th>
							</tr>
						</thead>
						<tbody>
							{#each selectedList as [k, v] (k)}
								<tr class="odd:bg-white even:bg-gray-50">
									<td class="px-2 py-1 text-gray-800">{k}</td>
									<td class="px-2 py-1 text-right tabular-nums text-gray-700"
										>{clamp01(v).toFixed(4)}</td
									>
									<td class="px-2 py-1">
										<div class="h-1.5 w-full bg-gray-200 rounded">
											<div
												class="h-1.5 bg-indigo-500 rounded"
												style={`width:${Math.round(clamp01(v) * 100)}%`}
											></div>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="min-w-full text-xs">
					<code class="block whitespace-pre-wrap break-words rounded bg-gray-100 px-1.5 py-1">
						{'[\n'}{selected.notes
							?.map((item) => `\t{ midi: ${item.midi}, dur: ${item.dur} `)
							.join('}, \n')}{selected.notes?.length ? '}' : ''}{'\n]'}
					</code>
				</div>
				<button
					class="py-2 px-5 w-full mb-1 rounded-md text-xs bg-gray-500 text-white hover:bg-black hover:cursor-pointer"
					onclick={() => (selected ? playSample(selected) : null)}
				>
					▶︎ Play
				</button>
				<button
					class="py-1 px-5 w-full rounded-md text-xs bg-white border-red-500 border-3 font-bold text-red-600 hover:text-white hover:bg-red-500 hover:cursor-pointer transition-colors"
					onclick={() => (selected ? deleteSound(selected.id) : null)}
				>
					Delete sound
				</button>
			</div>
		{/if}
		<svg viewBox={`0 0 ${width} ${height}`} class="w-full h-full">
			<defs>
				<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#eee" stroke-width="1" />
				</pattern>
			</defs>
			<rect x="0" y="0" {width} {height} fill="url(#grid)" onclick={() => (selected = null)} />
			{#if coords.length === samples.length}
				{#key colorKeys}
					{#each samples as s, i (s.id)}
						<circle
							cx={xPx(coords[i][0])}
							cy={yPx(coords[i][1])}
							r={selected?.id === s.id ? 6 : hover?.id === s.id ? 5 : 4}
							fill={colorFor(s, colorKeys)}
							class="cursor-pointer transition-transform duration-100 ease-out"
							stroke={selected?.id === s.id ? 'black' : 'rgba(0,0,0,0.2)'}
							stroke-width={selected?.id === s.id ? 1.5 : 1}
							onmouseenter={() => (hover = s)}
							onmouseleave={() => (hover = null)}
							onclick={() => {
								if (selected?.id === s.id) {
									selected = null;
								} else {
									selectSample(s);
								}
							}}
						/>
					{/each}
				{/key}
			{/if}
		</svg>
	</div>
	<div class="pr-1 lg:max-h-[90vh] lg:overflow-y-scroll mb-10">
		{#if errorMsg}
			<div class="bg-red-500 text-white text-center border-gray-200 p-2 rounded-xl shadow-sm mb-3">
				<p class="text-sm w-max-content">{errorMsg}</p>
			</div>
		{/if}
		<Card header="PCA Settings">
			<div class="p-4">
				<MultiSelect label="Color by" options={paramNames} bind:selected={colorKeys} />
				<MultiSelect
					class="mt-3"
					label="PCA parameters"
					onChange={computePCA}
					options={paramNames}
					bind:selected={pcaKeys}
				/>
			</div>
		</Card>
		<Card header="MIDI" class="mt-5">
			<div class="p-4">
				<MidiList bind:value={notes} />
			</div>
		</Card>
		<Card collapsed={false} header="Synth Settings" class="mt-5">
			<div class="p-4">
				<Synth callback={synthCallback} bind:notes />
			</div>
		</Card>

		<div>
			<div class="space-y-2 mt-5">
				<div class="flex justify-between gap-4">
					<button
						bind:this={CreateAnnotationTasksBtn}
						class="w-full py-1 rounded-lg bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-700 disabled:cursor-auto disabled:bg-blue-300"
						onclick={createAnnotationTasks}
					>
						Create tasks
					</button>
					<a
						class="block w-full text-center py-1 rounded-lg bg-gray-500 text-white hover:cursor-pointer hover:bg-gray-700 disabled:cursor-auto"
						href="/admin/tasks"
					>
						Show tasks
					</a>
				</div>

				<ButtonWithConfirmPrompt
					action="?/clearSounds"
					class="block w-full text-center px-7 py-1 rounded-lg bg-red-500 text-white hover:cursor-pointer hover:bg-red-700 disabled:cursor-auto"
				>
					Delete all sounds
				</ButtonWithConfirmPrompt>
			</div>
		</div>
	</div>
</div>
