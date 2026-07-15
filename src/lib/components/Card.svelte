<script lang="ts">
	let { header, class: className = '', children } = $props();
</script>

<div
	class="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-w-0 w-full {className}"
>
	<div class="w-full flex flex-row bg-blue-50 text-blue-950 py-2 px-5 rounded-t-xl m-0">
		<p>{header}</p>
	</div>
	<div class="flex-1 min-h-0">
		{@render children()}
	</div>
</div>
