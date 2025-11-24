const toRankIndex = (rank: Array<{ id: number; sound: string }>) =>
	rank.reduce<Record<string, number>>((acc, { sound }, index) => ((acc[sound] = index), acc), {});

export const orderSoundsByAnnotation = (
	initSounds: { soundId: string }[],
	annotation?: { rank: Array<{ id: number; sound: string }> }
) => {
	const sounds = initSounds.map(({ soundId }, index) => ({ id: index, sound: soundId }));

	const rank = annotation?.rank ?? [];
	if (!rank.length) return sounds;
	const rankIndex = toRankIndex(rank);
	const fallback = rank.length;

	return [...sounds].sort(
		(a, b) => (rankIndex[a.sound] ?? fallback) - (rankIndex[b.sound] ?? fallback)
	);
};