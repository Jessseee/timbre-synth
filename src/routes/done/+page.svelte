<script lang="ts">
	import * as m from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>Timbre Synth | Done!</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="p-4 mt-5 text-center space-y-4">
		<h1 class="text-xl font-bold">
			{@html m.robots_done_title()}
			<span class="icon-[carbon--music] text-2xl -mb-1 ml-1 text-blue-600"></span>
		</h1>
		<div
			class="relative mx-auto w-fit max-w-sm rounded-2xl border-2 border-blue-200 bg-white px-5 py-3 text-blue-950 shadow-sm"
		>
			<p>{m.robots_done_message()}</p>
			<span
				class="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-blue-200 bg-white"
				aria-hidden="true"
			></span>
		</div>
		<img
			class="-mt-22.5"
			src="/goodbye.gif"
			alt="robot waving goodbye"
		/>
		<p class="text-gray-500 mt-10">{m.robots_done_close()}</p>
	</div>
</div>
