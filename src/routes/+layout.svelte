<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, locales, setLocale, type Locale } from '$lib/paraglide/runtime';
	import { localeForPathname } from '$lib/paraglide.svelte';
	import '../app.css';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();

	let currentLocale = $derived(getLocale());
	let nextLocale = $derived(locales.find((locale) => locale !== currentLocale) ?? currentLocale);
	let routeLocale = $derived(localeForPathname(page.url.pathname));

	const flagIconClass: Record<Locale, string> = {
		en: 'icon-[circle-flags--gb]',
		nl: 'icon-[circle-flags--nl]'
	};

	function switchLocale() {
		setLocale(nextLocale as Locale, { reload: false });
	}

	$effect(() => {
		if (routeLocale && currentLocale !== routeLocale) {
			setLocale(routeLocale, { reload: false });
		}
	});
</script>

<svelte:head><title>Timbre Synth</title></svelte:head>

{#if !routeLocale}
	<button
		type="button"
		onclick={switchLocale}
		class="fixed top-3 right-3 z-50 inline-flex items-center gap-2 rounded bg-white px-3 py-1.5 text-sm font-bold uppercase text-blue-600 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50 hover:cursor-pointer"
		aria-label={`Switch language to ${nextLocale}`}
	>
		<span class="{flagIconClass[nextLocale as Locale]} text-lg" aria-hidden="true"></span>
		<span>{nextLocale}</span>
	</button>
{/if}

{@render children()}

<p class="md:fixed block m-4 bottom-0 right-0 text-slate-400 text-sm">
	{m.made_by()}:
	<a
		class="text-blue-400 underline-offset-2 underline hover:text-blue-700"
		target="_blank"
		href="https://www.linkedin.com/in/jesse-visser/">Jesse Visser</a
	>
</p>
