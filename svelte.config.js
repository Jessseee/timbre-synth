import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins: process.env.TRUSTED_ORIGINS ?? []
		}
	},

	onwarn: (warning, defaultHandler) => {
		if (warning.code.includes('a11y')) return;
		defaultHandler(warning);
	}
};

export default config;
