<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="h-100 flex flex-col justify-center items-center">
	<form class="w-xs max-h-min" method="POST" use:enhance>
		<label for="password">Enter password</label>
		<div class="flex gap-1">
			<input
				id="password"
				type="password"
				name="password"
				autocomplete="current-password"
				class="border-1 border-gray-200 px-2 rounded"
			/>
			<button
				type="submit"
				class:bg-red-500={form?.error}
				class="bg-green-500 rounded px-2 py-1 text-white hover:cursor-pointer hover:bg-green-700"
				>Go</button
			>
		</div>
	</form>
</div>
