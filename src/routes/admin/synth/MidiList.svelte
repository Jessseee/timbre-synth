<script lang="ts">
	import { onMount } from 'svelte';
	import { type MidiItem } from '$lib/frontend/Synth';

	let {
		value = $bindable(),
		minDur = 0.001,
		durStep = 0.05,
		showBulkEditor: showBulkEditorProp = false,
		autofocus = true
	} = $props<{
		value: MidiItem[];
		minMidi?: number;
		maxMidi?: number;
		minDur?: number;
		durStep?: number;
		midiStep?: number;
		showBulkEditor?: boolean;
		autofocus?: boolean;
	}>();

	/* svelte-ignore state_referenced_locally */
	let showBulkEditor = $state<boolean>(showBulkEditorProp);
	$effect(() => (showBulkEditor = showBulkEditorProp));

	let inputElements: HTMLInputElement[] | null = [];
	let firstInputEl: HTMLInputElement | null = null;

	$effect(() => {
		firstInputEl = inputElements[0];
	});

	onMount(() => {
		if (autofocus && firstInputEl) firstInputEl.focus();
		if (value.length === 0) addRow();
	});

	const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

	function roundToStep(n: number, step: number) {
		const k = Math.round(1 / step);
		return Math.round(n * k) / k;
	}
	const toNum = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v));

	function commit(next: MidiItem[]) {
		value = next.map(({ midi, dur }) => ({
			midi: clamp(Math.round(midi), 0, 127),
			dur: Math.max(minDur, +dur)
		}));
		previous = bulkText;
	}

	function addRow(index?: number) {
		const insertAt = index != null ? index + 1 : value.length;
		const prev = value[index ?? value.length - 1];
		const next: MidiItem = prev ? { ...prev } : { midi: 60, dur: 0.2 };
		const arr = value.slice();
		arr.splice(insertAt, 0, next);
		commit(arr);
	}

	function removeRow(i: number) {
		const arr = value.slice();
		arr.splice(i, 1);
		commit(arr.length ? arr : [{ midi: 60, dur: 0.2 }]);
	}

	function updateMidi(i: number, v: string | number) {
		const n = toNum(v);
		if (!Number.isFinite(n)) return;
		const arr = value.slice();
		arr[i] = { ...arr[i], midi: clamp(Math.round(n), 0, 127) };
		commit(arr);
	}

	function updateDur(i: number, v: string | number) {
		const n = toNum(v);
		if (!Number.isFinite(n)) return;
		const arr = value.slice();
		arr[i] = { ...arr[i], dur: Math.max(minDur, roundToStep(n, durStep)) };
		commit(arr);
	}

	let bulkText = $derived(
		'[\n' +
			value.map((item: MidiItem) => `\t{ midi: ${item.midi}, dur: ${item.dur} `).join('}, \n') +
			(value.length ? '}' : '') +
			'\n]'
	);
	/* svelte-ignore state_referenced_locally */
	let previous = bulkText;
	let bulkError = $state('');

	function parseLooseList(text: string): MidiItem[] {
		const cleaned = text
			.replace(/([{\[,]\s*)(midi|dur)(\s*:)/g, '$1"$2"$3') // ensure quoted keys
			.replace(/'/g, '"')
			.replace(/,(\s*[}\]])/g, '$1'); // trailing commas
		const parsed = JSON.parse(cleaned);
		if (!Array.isArray(parsed)) throw new Error('Expected an array.');
		return parsed.map((x: any, idx: number) => {
			const midi = toNum(x?.midi);
			const dur = toNum(x?.dur);
			if (!Number.isFinite(midi) || !Number.isFinite(dur)) {
				throw new Error(`Item ${idx} must have numeric midi & dur.`);
			}
			return { midi, dur };
		});
	}

	function applyBulk() {
		try {
			const next = parseLooseList(bulkText);
			commit(next);
			cancelBulkEditor();
		} catch (e: any) {
			bulkError = e?.message ?? 'Invalid list.';
		}
	}

	function openBulkEditor() {
		showBulkEditor = true;
		previous = bulkText;
	}

	function cancelBulkEditor() {
		showBulkEditor = false;
		bulkText = previous;
		bulkError = '';
	}

	function onRowKeydown(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addRow(i);
		} else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			e.preventDefault();
			const delta = e.key === 'ArrowUp' ? 1 : -1;
			updateMidi(i, (value[i].midi ?? 0) + delta);
		} else if (e.altKey && (e.key === '=' || e.key === '-')) {
			e.preventDefault();
			const delta = e.key === '=' ? durStep : -durStep;
			updateDur(i, (value[i].dur ?? minDur) + delta);
		} else if (e.key === 'Backspace') {
			const t = e.target as HTMLInputElement;
			if (t.value === '' && value.length > 1) {
				e.preventDefault();
				removeRow(i);
			}
		}
	}
</script>

<div class="space-y-2" role="group" aria-label="MIDI list editor">
	<div class="flex flex-row gap-5 text-sm">
		<div class="w-10 flex-1">Tone <span class="text-xs">(0-127)</span></div>
		<div class="w-10 flex-1 ml-1">Duration <span class="text-xs">(sec.)</span></div>
		<div class="flex-1"></div>
	</div>

	<div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto text-xs">
		{#each value as item, i (i)}
			<div class="flex flex-row gap-2">
				<input
					bind:this={inputElements[i]}
					type="number"
					inputmode="numeric"
					min={0}
					max={127}
					step={1}
					value={item.midi}
					onchange={(e) => updateMidi(i, e.currentTarget.value)}
					oninput={(e) => updateMidi(i, e.currentTarget.value)}
					onkeydown={(e) => onRowKeydown(e, i)}
					aria-label={`Row ${i + 1} MIDI`}
					class="w-10 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
				/>
				<input
					type="number"
					inputmode="decimal"
					min={minDur}
					step={durStep}
					value={item.dur}
					onchange={(e) => updateDur(i, e.currentTarget.value)}
					oninput={(e) => updateDur(i, e.currentTarget.value)}
					onkeydown={(e) => onRowKeydown(e, i)}
					aria-label={`Row ${i + 1} duration`}
					class="w-10 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
				/>
				<div class="flex flex-1 gap-2">
					<button
						type="button"
						title="Duplicate"
						onclick={() => addRow(i)}
						disabled={showBulkEditor}
						class="rounded-md border-2 border-green-300 text-green-300 font-bold px-2 py-1 hover:bg-green-50 hover:cursor-pointer disabled:opacity-50 disabled:cursor-default"
						>＋</button
					>
					<button
						type="button"
						title="Delete"
						onclick={() => removeRow(i)}
						disabled={value.length <= 1 || showBulkEditor}
						class="rounded-md border-2 border-red-300 text-red-300 px-2 py-1 hover:bg-red-50 hover:cursor-pointer disabled:opacity-50 disabled:cursor-default"
						>✕</button
					>
				</div>
			</div>
		{/each}
	</div>

	{#if showBulkEditor}
		{#if bulkError}
			<div class="text-sm bg-red-600 p-2 rounded text-white">{bulkError}</div>
		{/if}
		<div class="space-y-2 pt-1">
			<textarea
				bind:value={bulkText}
				rows={6}
				spellcheck="false"
				class="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-gray-300"
			></textarea>
			<button
				type="button"
				onclick={applyBulk}
				class="rounded-md border-2 border-green-300 text-green-300 bg-white px-3 py-1.5 text-sm hover:bg-green-50 hover:cursor-pointer"
				>Apply</button
			>
			<button
				type="button"
				class="rounded-md border-2 border-orange-300 text-orange-300 bg-white px-3 py-1.5 text-sm hover:bg-orange-50 hover:cursor-pointer"
				onclick={cancelBulkEditor}
			>
				Cancel
			</button>
		</div>
	{:else}
		<div class="relative min-w-full text-xs d-inline-block">
			<button
				type="button"
				class="absolute top-1 right-[1.5em] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 hover:cursor-pointer"
				onclick={openBulkEditor}
			>
				Edit
			</button>
			<code
				class="block whitespace-pre-wrap wrap-break-word rounded bg-gray-100 px-1.5 py-1 max-h-[100px] overflow-y-scroll"
			>
				{bulkText}
			</code>
		</div>
	{/if}
</div>
