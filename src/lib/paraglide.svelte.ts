import type { Locale as _Locale } from '$lib/paraglide/runtime';
import { browser } from '$app/environment';

import {
	baseLocale,
	cookieMaxAge,
	cookieName,
	getTextDirection,
	overwriteGetLocale,
	overwriteSetLocale,
	toLocale
} from '$lib/paraglide/runtime';

function localeCookie() {
	return document.cookie
		.split('; ')
		.find((cookie) => cookie.startsWith(`${cookieName}=`))
		?.split('=')[1];
}

function writeLocaleCookie(locale: _Locale) {
	document.cookie = `${cookieName}=${locale}; path=/; max-age=${cookieMaxAge}`;
}

function updateDocumentLocale(locale: _Locale) {
	document.documentElement.lang = locale;
	document.documentElement.dir = getTextDirection(locale);
}

export class Locale {
	#current: _Locale = $state(
		toLocale(browser && localeCookie()) ??
			toLocale(browser && document.querySelector('html')?.lang) ??
			baseLocale
	);

	constructor() {
		if (browser) {
			updateDocumentLocale(this.#current);
		}

		overwriteGetLocale(() => this.#current);

		overwriteSetLocale((locale, options) => {
			this.#current = locale;

			if (browser) {
				writeLocaleCookie(locale);
				updateDocumentLocale(locale);
			}

			if (options?.reload !== false) {
				window.location.reload();
			}
		});
	}
}
