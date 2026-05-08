<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let {
		playSound,
		playing = $bindable(),
		curSoundId = $bindable(),
		annotations: initAnnotations
	} = $props();
	let open = $state();

	let annotations = $derived(initAnnotations)

	async function deleteAnnotation(taskId: string, annotatorId: string) {
		await fetch("/api/annotation", { method: "DELETE", body: JSON.stringify({ taskId, annotatorId }) })
		annotations = annotations.filter((annotation: any) => annotation.annotatorId !== annotatorId)
	}

</script>

<table class="min-w-[300px]">
	<tbody>
		{#each annotations as { taskId, annotatorId, data, status }, i (annotatorId)}
			{#if i === 0 || open}
				<tr class="not-last:border-b border-gray-200">
					<td>
						{#if status === 'done'}
							<span
								class="icon-[carbon--checkbox-checked-filled] text-green-500 text-xl -mb-1"
							></span>
						{:else}
							<span
								class="icon-[carbon--checkbox-indeterminate-filled] text-amber-500 text-xl -mb-1"
							></span>
						{/if}
					</td>
					<td class="text-xs px-2">{annotatorId.slice(-10, -1)}</td>
					{#each data as { id, sound } (id)}
						<td class="p-1 text-center text-xs">
							<p class="mb-1">{id + 1}</p>
							<AudioPlayer
								bind:playing
								bind:curId={curSoundId}
								src={`/sound/${sound}`}
								{playSound}
							/>
						</td>
					{/each}
					<td>
						<button
							class="block text-center rounded-lg px-1 -mb-2 mx-2 bg-red-500 text-white hover:cursor-pointer hover:bg-red-700 disabled:cursor-auto"
							onclick={() => deleteAnnotation(taskId, annotatorId)}
						>
							<span class="icon-[carbon--trash-can] -mb-0.5"></span>
						</button>
					</td>
					{#if i === 0 && annotations.length > 1}
						<td>
							<button class="hover:cursor-pointer" onclick={() => open = !open}>
								{#if open}
									<span class="icon-[carbon--caret-up] text-2xl -mb-1 mx-2"></span>
								{:else}
									<span class="icon-[carbon--caret-down] text-2xl -mb-1 mx-2"></span>
								{/if}
							</button>
						</td>
					{/if}
				</tr>
			{/if}
		{/each}
	</tbody>
</table>