<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { MidiItem } from '$lib/frontend/Synth';
	import { Frequency } from 'tone';

	const preferredCellSize = 32;
	const minRows = 4;
	const minColumns = 4;
	const labelWidth = 36;
	const stepDur = 0.2;
	const bufferRows = 2;

	let {
		value = $bindable(),
		pitch,
		currentStep = $bindable(),
		class: className = ''
	}: {
		value: MidiItem[];
		pitch: number;
		currentStep?: number | null;
		class?: string;
	} = $props();

	let container: HTMLDivElement;
	let rowCount = $state(9);
	let columnCount = $state(8);
	let cellSize = $state(preferredCellSize);

	function clamp(n: number, min: number, max: number) {
		return Math.min(max, Math.max(min, n));
	}

	function emptyStep(): MidiItem {
		return { note: null, dur: stepDur };
	}

	function normalizeSteps(items: MidiItem[]): MidiItem[] {
		return Array.from({ length: columnCount }, (_, i) => {
			const item = items[i];
			return {
				note: item?.note == null ? null : clamp(Math.round(item.note), 0, rowCount - 1),
				dur: item?.dur == null || !Number.isFinite(item.dur) ? stepDur : item.dur
			};
		});
	}

	function commit(next: MidiItem[]) {
		value = normalizeSteps(next);
	}

	let gridValue = $derived(normalizeSteps(value));

	function noteForRow(row: number) {
		return rowCount - 1 - row;
	}

	function isActive(row: number, col: number) {
		return gridValue[col]?.note === noteForRow(row);
	}

	function toggleCell(row: number, col: number) {
		const note = noteForRow(row);
		const next = normalizeSteps(gridValue);

		next[col] = next[col].note === note ? { ...next[col], note: null } : { ...next[col], note };
		commit(next);
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			const nextRows = Math.max(minRows, Math.round(height / preferredCellSize));
			const nextCellSize = height / nextRows;
			const nextColumns = Math.max(minColumns, Math.floor((width - labelWidth) / nextCellSize));

			rowCount = nextRows;
			cellSize = nextCellSize;
			columnCount = nextColumns;
		});

		resizeObserver.observe(container);
		commit(value?.length ? value : Array.from({ length: columnCount }, emptyStep));

		return () => {
			resizeObserver.disconnect();
		};
	});

	let noteRows = $derived(
		Array.from({ length: rowCount + bufferRows * 2 }, (_, i) => {
			const midi = pitch + (rowCount - 1 + bufferRows - i);
			return {
				id: midi,
				label: Frequency(midi, "midi").toNote()
			};
		})
	);

	let rows = $derived(Array.from({ length: rowCount }, (_, row) => row));
	let columns = $derived(Array.from({ length: columnCount }, (_, col) => col));
</script>

<div bind:this={container} class="min-w-0 {className}" role="group" aria-label="Sequencer">
	<div class="flex min-w-max">
		<div class="relative overflow-hidden" style={`height: ${rowCount * cellSize}px;`}>
			<div style={`transform: translateY(-${bufferRows * cellSize}px);`}>
				{#each noteRows as note (note.id)}
					<div
						animate:flip={{ duration: 120 }}
						class="flex items-center justify-end mr-2 ml-1 select-none text-gray-400 text-xs"
						style={`height: ${cellSize}px;`}
					>
						{note.label}
					</div>
				{/each}
			</div>
		</div>

		<div
			class="grid w-full shadow-blue-50 shadow-sm rounded-sm overflow-hidden"
			style={`grid-template-columns: repeat(${columnCount}, ${cellSize}px); grid-auto-rows: ${cellSize}px;`}
		>
			{#each rows as row}
				{#each columns as col}
					<button
						type="button"
						aria-label={`Step ${col + 1}, note ${noteForRow(row)}`}
						aria-pressed={isActive(row, col)}
						class:bg-blue-800={currentStep === col}
						class:border-blue-300!={currentStep === col}
						style={`width: ${cellSize}px; height: ${cellSize}px;`}
						class={`border transition rounded-sm hover:cursor-pointer ${
							isActive(row, col)
								? 'bg-blue-400 border-blue-500 border-none'
								: 'bg-white border-blue-100 hover:bg-blue-100'
						}`}
						onclick={() => toggleCell(row, col)}
					>
						{#if isActive(row, col)}
							<span class="icon-[mage--music-fill] text-white -mb-0.5"></span>
						{/if}
					</button>
				{/each}
			{/each}
		</div>
	</div>
</div>
