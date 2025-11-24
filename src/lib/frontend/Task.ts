export const descriptorNames = ['brightness', 'resonance', 'roughness'] as const;

export type Descriptor = (typeof descriptorNames)[number];

export type Task = {
	id: string;
	descriptor: Descriptor;
	sounds: string[];
};