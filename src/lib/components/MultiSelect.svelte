<script>
	import { SvelteSet } from 'svelte/reactivity';

	let { label, options, class: className = '', onChange = null, selected = $bindable() } = $props();
</script>

<div class="flex items-center justify-between {className}">
	<label class="block text-xs font-medium text-gray-600">{label}</label>
	<div class="flex gap-2">
		<button
			class="text-xs text-indigo-600 hover:underline"
			onclick={() => {
				selected = new Set(options);
				onChange?.();
			}}
		>
			Select all
		</button>
		<button
			class="text-xs text-indigo-600 hover:underline"
			onclick={() => {
				selected = new Set();
				onChange?.();
			}}
		>
			Clear
		</button>
	</div>
</div>
<div class="mt-2 grid grid-cols-2 gap-2 max-h-56 overflow-auto pr-1">
	{#each options as k (k)}
		<label class="flex items-center gap-2 text-xs text-gray-700">
			<input
				type="checkbox"
				class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				checked={selected.has(k)}
				onchange={(e) => {
					const on = e.target?.checked;
					const next = new SvelteSet(selected);
					if (on) {
						next.add(k);
					} else {
						next.delete(k);
					}
					selected = next;
					onChange?.();
				}}
			/>
			<span>{k}</span>
		</label>
	{/each}
</div>
