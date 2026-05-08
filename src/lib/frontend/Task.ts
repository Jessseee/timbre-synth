import { type MidiItem, type Params } from './Synth';

export const descriptorNames = ['brightness', 'resonance', 'roughness'] as const;

export const descriptorMinMax: Record<(typeof descriptorNames)[number], string[]> = {"brightness": ["dull", "bright"], 'resonance': ["dry", "resonant"], "roughness": ["smooth", "rough"]} as const;

export type Descriptor = (typeof descriptorNames)[number];

export type RankingTask = {
	id: string;
	descriptor: Descriptor;
	sounds: string[];
};

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
		name: string;
		description: string;
		imageUrl: string;
	};
	sound: SynthPatch;
	soundId: string;
};