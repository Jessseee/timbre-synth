import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: '404.html'
		})
	},

	onwarn: (warning, defaultHandler) => {
		if (warning.code.includes('a11y')) return;
		defaultHandler(warning);
	}
};

export default config;
