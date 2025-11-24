<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import Annotations from './Annotations.svelte';
	import ButtonWithConfirmPrompt from '$lib/components/ButtonWithConfirmPrompt.svelte';

	const { data } = $props();

	let annotated = $derived(data.tasks.reduce((acc, task) => acc + Number(task.annotations.length > 0), 0))

	let pageSize = $state(50);
	let curPage = $state(0)
	let maxPage = $derived(Math.ceil(data.tasks.length / pageSize))

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let curSoundId = $state();

	function playSound(src: string) {
		if (!audio) {
			audio = new Audio();
			audio.onended = () => {
				playing = false;
				curSoundId = null;
			};
			audio.onplay = () => {
				playing = true;
			};
		}
		if (playing) return;
		curSoundId = src.split('/').at(-1);
		audio.src = src;
		audio.currentTime = 0;
		return audio.play();
	}

	function paginate(array: Array<any>, pageSize: number): Array<any> {
		return new Array(maxPage).fill(undefined).map((_, i) => array.slice(i * pageSize, (i + 1) * pageSize));
	}
</script>

<div class="mx-auto w-max my-5">
	<div class="flex gap-2">
		<div class="bg-green-500 text-white font-bold px-5 py-0.5 text-center rounded-lg mb-2">
			Annotated: {annotated}/{data.tasks.length}
		</div>
		<div class="ml-auto flex gap-3">
			<form action="?/clearAssigned" method="POST" class="mb-2">
				<button
					class="block text-center px-5 py-0.5 rounded-lg bg-amber-500 text-white hover:cursor-pointer hover:bg-amber-700 disabled:cursor-auto"
					type="submit"
				>
					Clear Assigned
				</button>
			</form>
			<form action="?/clearPending" method="POST" class="mb-2">
				<button
					class="block text-center px-5 py-0.5 rounded-lg bg-red-500 text-white hover:cursor-pointer hover:bg-red-700 disabled:cursor-auto"
					type="submit"
				>
					Clear Pending
				</button>
			</form>
			<ButtonWithConfirmPrompt
				action="?/clearTasks"
				class="block text-center px-5 py-0.5 mb-2 rounded-lg bg-red-500 text-white hover:cursor-pointer hover:bg-red-700 disabled:cursor-auto"
			>
				Delete All Tasks
			</ButtonWithConfirmPrompt>
			<button
				onclick={() => location.reload()}
				class="block text-center w-10 px-1 py-0.5 mb-2 rounded-lg bg-gray-200 hover:cursor-pointer hover:bg-gray-300"
			>
				<span class="icon-[carbon--renew] -mb-0.5"></span>
			</button>
		</div>
	</div>
	<div class="h-[82vh] overflow-y-scroll">
		<table class="table-auto">
			<thead class="bg-gray-100 border-b-2 border-gray-200">
				<tr>
					<th class="px-2 py-1">Assigned</th>
					<th class="px-2 py-1">Descriptor</th>
					<th class="px-2 py-1">Sounds</th>
					<th>Annotations</th>
				</tr>
			</thead>
			<tbody>
				{#each paginate(data.tasks, pageSize)[curPage] as task (task.id)}
					<tr class:bg-green-50={task.tutorial} class="border-b-2 border-gray-200">
						<td class="text-center">
							{#if task.tutorial}
								<span class="text-sm font-bold">Tutorial</span>
							{:else}
								<span class="text-xs">{task.sessionId?.slice(-10, -1)}</span>
							{/if}
						</td>
						<td class="px-2 py-1">
							{task.descriptor.charAt(0).toUpperCase() + task.descriptor.slice(1)}
						</td>
						<td class="px-2 py-1">
							<table>
								<tbody>
									<tr>
										{#each task.sounds as { soundId }, i (soundId)}
											<td class="px-1 text-xs text-center">
												<p class="mb-1">{i + 1}</p>
												<AudioPlayer
													bind:playing
													bind:curId={curSoundId}
													src={`/sound/${soundId}`}
													{playSound}
												/>
											</td>
										{/each}
									</tr>
								</tbody>
							</table>
						</td>
						<td>
							<Annotations bind:playing={playing} playSound={playSound} curSoundId={curSoundId} annotations={task.annotations}/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="flex">
		<div class="flex items-center gap-3">
			<p class="mt-0.5">{curPage * pageSize + 1}-{Math.min(data.tasks.length, (curPage + 1) * pageSize)}/{data.tasks.length}</p>
			<select
				bind:value={pageSize}
				onchange={() => curPage = 0}
				class="px-2 py-1 ring rounded ring-gray-300 text-gray-600">
				<option value={10}>10</option>
				<option value={50}>50</option>
			</select>
		</div>
		<div class="ml-auto">
			<button
				class="py-2 px-5 mb-1 rounded-md text-xs bg-blue-500 text-white hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
				disabled={curPage === 0}
				onclick={() => curPage -= 1}
			>
				Prev
			</button>
			<button
				class="py-2 px-5 mb-1 rounded-md text-xs bg-blue-500 text-white hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
				disabled={curPage >= maxPage - 1}
				onclick={() => curPage += 1}
			>
				Next
			</button>
		</div>
	</div>
</div>
