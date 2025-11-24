export async function hashObject(params: { [index: string]: any }): Promise<string> {
	const sorted = Object.keys(params).sort();
	const normalized: Record<string, number> = {};
	for (const k of sorted) normalized[k] = params[k];
	const bytes = new TextEncoder().encode(JSON.stringify(normalized));
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
