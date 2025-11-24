<script>
	import Annotator from '$lib/components/Annotator.svelte';

	const { data, form } = $props();
</script>

{#if data.tasks}
	<Annotator {form} initTasks={data.tasks} />
{:else}
		<div class="mx-auto mt-10 max-w-lg">
			<div class="p-4 mt-5 text-center">
				<h1 class="text-2xl font-bold mb-5 ml-3">
					Thank you for participating! <span class="icon-[logos--partytown-icon] text-4xl -mb-1.5 ml-1"></span>
				</h1>
				<p class="mb-2 text-lg">
					There are no more annotation tasks left!
				</p>
				<p class="text-gray-300 font-bold">You may close this page.</p>
			</div>
		</div>
{/if}
