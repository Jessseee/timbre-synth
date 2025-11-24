<script>
	const {
		src,
		class: className = '',
		curId = $bindable(),
		playing = $bindable(),
		playSound,
		stopSound = undefined
	} = $props();

	const id = $derived(src?.split('/').at(-1));
</script>

<button
	class:!border-gray-400={curId === id}
	class:hover:bg-gray-300={!playing || (curId === id && stopSound)}
	class:hover:cursor-pointer={!playing || curId === id}
	class="flex border-2 border-transparent items-center justify-center w-[2em] h-[2em] rounded-full bg-gray-200 {className}"
	onclick={async () => (curId === id ? await stopSound?.() : await playSound?.(src))}
>
	{#if curId === id && stopSound}
		<span class="icon-[carbon--stop-filled-alt] text-gray-900"></span>
	{:else}
		<span class="icon-[carbon--play-filled-alt] ml-0.5 text-gray-900"></span>
	{/if}
</button>
