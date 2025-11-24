<script lang="ts">
	import { slide } from 'svelte/transition';

	let { header, collapsable = true, collapsed = true, class: className = '', children } = $props();
</script>

<div class="bg-white border border-gray-200 rounded-xl shadow-sm space-y-4 {className}">
	<button
		class="w-full flex flex-row bg-blue-50 text-blue-950 py-2 px-5 rounded-t-xl m-0"
		class:hover:cursor-pointer={collapsable}
		class:rounded-xl={collapsable && collapsed}
		onclick={() => (collapsed = !collapsed)}
	>
		<p>{header}</p>
		{#if collapsable}
			<span class="ml-auto font-bold hover:cursor-pointer">
				{collapsed ? '˅' : '˄'}
			</span>
		{/if}
	</button>
	{#if !collapsable || !collapsed}
		<div transition:slide>
			{@render children()}
		</div>
	{/if}
</div>
