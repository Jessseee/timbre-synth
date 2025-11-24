<script lang="ts">
	const { action, explanation = "This action is irreversible!", class: className = "", children = null } = $props()

	let modalOpen = $state(false)
</script>

<button class={className} onclick={() => modalOpen = true}>
	{@render children()}
</button>

{#if modalOpen}
	<div
		onclick={() => modalOpen = false}
		class="opacity-10 bg-black left-0 top-0 right-0 bottom-0 absolute z-10 blur-3xl hover:cursor-pointer"
	>
	</div>
	<div class="absolute left-0 top-0 right-0 bottom-0 flex">
		<div class="m-auto z-100">
			<div class="bg-white rounded-lg p-1 flex flex-col">
				<div class="flex mb-3">
					<h3 class="font-bold ml-2">Are you sure?</h3>
					<button
						onclick={() => modalOpen = false}
						class="hover:cursor-pointer ml-auto"
					>
						<span class="icon-[carbon--close-large] text-red-500"></span>
					</button>
				</div>
				<form
					class="px-4 flex-col flex gap-3 text-center"
					action="{action}"
					method="POST"
				>
					<p>{explanation}</p>
					<button type="submit" class="text-center w-50 px-7 py-0.5 mb-2 rounded-lg bg-red-500 text-white hover:cursor-pointer hover:bg-red-700 disabled:cursor-auto">
						{@render children()}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}