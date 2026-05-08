<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import type { MidiItem } from '$lib/frontend/Synth';
	import * as Tone from 'tone';

	let {
		value = $bindable(),
		pitch,
		currentStep = $bindable(),
		rangeWidth = 9,
		initialSteps = 8,
		minSteps = initialSteps,
		stepDur = 0.2,
		showBulkEditor: showBulkEditorProp = false,
		hideBulkEditor = false,
		expandable = false
	} = $props<{
		value: MidiItem[];
		pitch: number;
		currentStep?: number | null;
		rangeWidth?: number;
		initialSteps?: number;
		minSteps?: number;
		defaultDur?: number;
		showBulkEditor?: boolean;
		hideBulkEditor?: boolean;
		expandable?: boolean;
	}>();

	/* svelte-ignore state_referenced_locally */
	let steps = $state(Math.max(initialSteps, minSteps));

	/* svelte-ignore state_referenced_locally */
	let showBulkEditor = $state<boolean>(showBulkEditorProp);
	$effect(() => (showBulkEditor = showBulkEditorProp));

	function clamp(n: number, min: number, max: number) {
		return Math.min(max, Math.max(min, n));
	}

	function toNum(v: string | number): number | null {
		const n = typeof v === 'number' ? v : Number(v);
		return Number.isFinite(n) ? n : null;
	}

	function emptyStep(): MidiItem {
		return { note: null, dur: stepDur };
	}

	function normalizeSteps(items: MidiItem[], width: number): MidiItem[] {
		return Array.from({ length: width }, (_, i) => {
			const item = items[i];
			return {
				note:
					item?.note == null
						? null
						: clamp(Math.round(item.note), 0, rangeWidth - 1),
				dur:
					item?.dur == null || !Number.isFinite(item.dur)
						? stepDur
						: item.dur
			};
		});
	}

	function trimTrailingEmptySteps(items: MidiItem[], min = 1): MidiItem[] {
		let end = items.length;
		while (
			end > min &&
			items[end - 1]?.note == null &&
			items[end - 2]?.note == null
			) {
			end--;
		}
		return items.slice(0, Math.max(end, min));
	}

	function ensureTrailingEmptyColumn(items: MidiItem[]): MidiItem[] {
		if (items.length === 0) return [emptyStep()];
		const last = items[items.length - 1];
		if (last.note != null) return [...items, emptyStep()];
		return items;
	}

	function commit(next: MidiItem[]) {
		let normalized = normalizeSteps(next, Math.max(next.length, 1));
		normalized = trimTrailingEmptySteps(normalized, 1);
		if (expandable) normalized = ensureTrailingEmptyColumn(normalized);

		value = normalized;
		steps = Math.max(minSteps, normalized.length);
		previous = bulkText;
	}

	let gridValue = $derived(normalizeSteps(value, steps));

	function isActive(row: number, col: number) {
		return gridValue[col]?.note === rangeWidth - 1 - row;
	}

	function toggleCell(row: number, col: number) {
		const note = rangeWidth - 1 - row;
		const next = normalizeSteps(gridValue, Math.max(steps, col + 1));

		next[col] =
			next[col].note === note
				? { ...next[col], note: null }
				: { ...next[col], note };

		commit(next);
	}

	let bulkText = $derived(
		'[\n' +
		value
			.map(
				(item: MidiItem) =>
					`\t{ "note": ${item.note === null ? 'null' : item.note}, "dur": ${item.dur} }`
			)
			.join(',\n') +
		'\n]'
	);

	/* svelte-ignore state_referenced_locally */
	let previous = bulkText;
	let bulkError = $state('');

	function parseLooseList(text: string): MidiItem[] {
		const cleaned = text
			.replace(/([{\[,]\s*)(note|dur)(\s*:)/g, '$1"$2"$3')
			.replace(/'/g, '"')
			.replace(/,(\s*[}\]])/g, '$1');

		const parsed = JSON.parse(cleaned);
		if (!Array.isArray(parsed)) throw new Error('Expected an array.');

		return parsed.map((x: MidiItem, idx: number) => {
			const dur = toNum(x.dur);
			if (dur == null) throw new Error(`Item ${idx} must have a numeric dur.`);

			if (x.note == null) return { note: null, dur };

			const note = toNum(x.note);
			if (note == null) {
				throw new Error(`Item ${idx} must have a numeric note or null.`);
			}

			return { note: clamp(Math.round(note), 0, rangeWidth - 1), dur };
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

	onMount(() => {
		commit(value?.length ? value : [emptyStep()]);
	});

	const BUFFER = 2;

	let bufferedRows = $derived(
		Array.from({ length: rangeWidth + BUFFER * 2 }, (_, i) => {
			const midi = pitch + (rangeWidth - 1 + BUFFER - i);

			return {
				id: midi,
				label: midi
			};
		})
	);
</script>

<div class="space-y-3" role="group" aria-label="Sequencer">
	<div>
		<div class="flex min-w-max">
			<div
				class="relative overflow-hidden"
				style={`height: ${rangeWidth * 32}px;`}
			>
				<div style={`transform: translateY(-${BUFFER * 32}px);`}>
					{#each bufferedRows as note (note.id)}
						<div
							animate:flip={{ duration: 120 }}
							class="h-8 flex items-center justify-end mr-2 select-none text-gray-400 text-xs"
						>
							{note.label}
						</div>
					{/each}
				</div>
			</div>

			<div
				class="grid shadow-blue-50 shadow-sm rounded-sm max-w-100 lg:max-w-70 overflow-x-auto"
				style={`grid-template-columns: repeat(${steps}, 2rem); grid-auto-rows: 2rem;`}
			>
				{#each Array.from({ length: rangeWidth }, (_, row) => row) as row}
					{#each Array.from({ length: steps }, (_, col) => col) as col}
						<button
							type="button"
							aria-label={`Step ${col + 1}, note ${rangeWidth - 1 - row}`}
							aria-pressed={isActive(row, col)}
							class:bg-blue-800={currentStep === col}
							class:border-blue-300!={currentStep === col}
							class={`aspect-square w-8 h-8 border transition rounded-sm ${
								isActive(row, col)
									? 'bg-blue-400 border-blue-500 border-none'
									: 'bg-white border-blue-100 hover:bg-blue-100'
							}`}
							onclick={() => toggleCell(row, col)}
						>
							{#if expandable && col === steps - 1}
								<p class="text-xl text-blue-100 font-bold -mt-1">+</p>
							{/if}
						</button>
					{/each}
				{/each}
			</div>
		</div>
	</div>

	{#if showBulkEditor}
		{#if bulkError}
			<div class="text-sm bg-red-600 p-2 rounded text-white">{bulkError}</div>
		{/if}
		<div class="space-y-2 pt-1">
			<textarea
				bind:value={bulkText}
				rows={8}
				spellcheck="false"
				class="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-gray-300"
			></textarea>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={applyBulk}
					class="rounded-md border-2 border-green-300 text-green-300 bg-white px-3 py-1.5 text-sm hover:bg-green-50 hover:cursor-pointer"
				>
					Apply
				</button>
				<button
					type="button"
					class="rounded-md border-2 border-orange-300 text-orange-300 bg-white px-3 py-1.5 text-sm hover:bg-orange-50 hover:cursor-pointer"
					onclick={cancelBulkEditor}
				>
					Cancel
				</button>
			</div>
		</div>
	{:else if !hideBulkEditor}
		<div class="relative min-w-full text-xs max-h-60 overflow-y-auto">
			<button
				type="button"
				class="absolute top-1 right-[1.5em] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 hover:cursor-pointer"
				onclick={openBulkEditor}
			>
				Edit
			</button>
			<code class="block whitespace-pre-wrap rounded bg-gray-100 px-1.5 py-1 overflow-y-auto">
				{bulkText}
			</code>
		</div>
	{/if}
</div>