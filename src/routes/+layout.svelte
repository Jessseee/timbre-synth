<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Timbre Thesis</title>
</svelte:head>

{@render children()}
