<script lang="ts">
	let { children, name, required = false } = $props();
</script>

<div class="p-2 my-2 block text-center">
	<span class="block mb-2 font-medium">{@render children()}</span>
	<span class="text-sm flex justify-between">
		<label class="flex flex-col">
			<input {name} type="radio" value="-2" {required} />
			strongly<br />disagree
		</label>
		<label class="flex flex-col">
			<input {name} type="radio" value="-1" {required} />
			disagree
		</label>
		<label class="flex flex-col">
			<input {name} type="radio" value="0" {required} />
			neutral
		</label>
		<label class="flex flex-col">
			<input {name} type="radio" value="1" {required} />
			agree
		</label>
		<label class="flex flex-col">
			<input {name} type="radio" value="2" {required} />
			strongly<br />agree
		</label>
	</span>
</div>
