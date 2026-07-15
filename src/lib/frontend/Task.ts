import { type MidiItem, type Params } from './Synth';

export const descriptorNames = ['brightness', 'resonance', 'roughness'] as const;

export type Descriptor = (typeof descriptorNames)[number];

export type SynthPatch = {
	id?: string;
	params: Params;
	descriptors: Record<Descriptor, number>;
	pitch: number;
	notes: MidiItem[];
};

export type RobotTask = {
	id: string;
	robot: {
		imageUrl: string;
		icon: string;
		name: () => string;
		summary: () => string;
		description: () => string;
	};
	sound: SynthPatch;
	soundId: string | null;
};
