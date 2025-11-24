import * as Tone from 'tone';

export type Sample = { id: string; params: Params; notes: MidiItem[] | null };

export const paramNames = ['harmonics', 'vibratoFreq', 'vibratoDepth', 'release'];

export type Params = {
	[K in (typeof paramNames)[number]]: number;
};

type Note = { dur: number; midi?: number; vel?: number; porta?: number };

export type MidiItem = { midi: number; dur: number };

export interface Synth {
	start(): Promise<void>;
	trigger(sequence: Note[], when?: number): void;
	dispose(): void;
	readonly params: Params;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
const expScale = (min: number, max: number, t: number) => min * Math.pow(max / min, clamp01(t));

export function parseParams(p: Params) {
	return {
		harmonics: clamp01(p.harmonics),
		vibratoFreq: lerp(30, 70, p.vibratoFreq),
		vibratoDepth: expScale(0.01, 0.2, p.vibratoDepth),
		release: expScale(0.3, 1.5, p.release)
	};
}

export async function createSynth(p: Params): Promise<Synth> {
	const params = parseParams(p);

	const source = [
		new Tone.Oscillator({
			type: 'triangle',
			frequency: 200,
			volume: 0
		}).start(),
		new Tone.Oscillator({
			type: 'sawtooth',
			frequency: 200,
			volume: -10
		}).start()
	];

	const crossfade = new Tone.CrossFade(params.harmonics);
	source[0].connect(crossfade.a);
	source[1].connect(crossfade.b);

	const vibrato = new Tone.Vibrato(params.vibratoFreq, params.vibratoDepth);

	const envelope = new Tone.AmplitudeEnvelope({
		attack: 0.01,
		decay: 0.12,
		sustain: 0.95,
		release: params.release
	});

	crossfade.chain(vibrato, envelope);

	const output = envelope.toDestination();

	const modules = [...source, crossfade, envelope, vibrato];

	function trigger(sequence: Note[], when = Tone.now()) {
		let t = 0;
		let sustaining = false;

		for (let i = 0; i < sequence.length; i++) {
			const step = sequence[i];
			const stepDur = Math.max(0, step.dur);
			const start = when + t;
			const end = start + stepDur;

			if (!step.midi) {
				if (sustaining) {
					envelope.triggerRelease(start);
					sustaining = false;
				}
				t += stepDur;
				continue;
			}

			const freq = Tone.Frequency(step.midi, 'midi').toFrequency();
			const vel = step.vel ?? 0.9;
			const porta = step.porta ?? 0.05;

			if (!sustaining) {
				// First note in a phrase — start new envelope
				source.forEach((osc) => osc.frequency.setValueAtTime(freq, start));
				envelope.triggerAttack(start, vel);
				sustaining = true;
			} else {
				// Legato transition: glide smoothly to the new pitch
				source.forEach((osc) => {
					osc.frequency.cancelAndHoldAtTime(start);
					osc.frequency.linearRampTo(freq, porta, start);
				});
			}

			// Check whether to release at end of note or keep sustaining
			const next = sequence[i + 1];
			const shouldRelease = !next || !next.midi;
			if (shouldRelease) {
				envelope.triggerRelease(Math.max(start, end - 0.02));
				sustaining = false;
			}

			t += stepDur;
		}
	}

	function dispose() {
		modules.forEach((n) => n.dispose());
	}

	async function start() {
		await Tone.start();
		await Tone.getContext().resume?.();
	}

	return {
		start,
		trigger,
		dispose,
		get params() {
			return p;
		}
	};
}

export function makeParamSets(n: number, seed = 1234): Params[] {
	function mulberry32(seed: number): () => number {
		return function () {
			let t = (seed += 0x6d2b79f5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function lhs(n: number, d: number, seed: number): number[][] {
		const rand = mulberry32(seed);
		const samples: number[][] = Array.from({ length: n }, () => Array(d).fill(0));
		for (let j = 0; j < d; j++) {
			const col = Array.from({ length: n }, (_, i) => (i + rand()) / n);
			for (let i = n - 1; i > 0; i--) {
				const k = Math.floor(rand() * (i + 1));
				[col[i], col[k]] = [col[k], col[i]];
			}
			for (let i = 0; i < n; i++) samples[i][j] = col[i];
		}
		return samples;
	}

	const S = lhs(n, paramNames.length, seed);
	return S.map((row) => {
		const obj: any = {};
		row.forEach((x, j) => {
			obj[paramNames[j]] = x;
		});
		return obj as Params;
	});
}
