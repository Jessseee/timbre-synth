import type { SynthPlaybackState } from './Synth';

export type EmbedSyncRole = 'controller' | 'display';

export type EmbedSyncState = {
	tasks: string;
	taskId: number;
	completed: boolean[];
	playback: SynthPlaybackState;
};

export type EmbedSyncMessage =
	| {
			version: 1;
			type: 'request-state';
	  }
	| {
			version: 1;
			type: 'state';
			state: EmbedSyncState;
	  }
	| {
			version: 1;
			type: 'request-synth-state';
	  }
	| {
			version: 1;
			type: 'synth-state';
			patch: string;
			playback: SynthPlaybackState;
	  };

export type EmbedSyncConfig = {
	role: EmbedSyncRole;
	channelName: string;
};

export function embedSyncRole(url: URL): EmbedSyncRole | null {
	const role = url.searchParams.get('role');
	return role === 'controller' || role === 'display' ? role : null;
}

export function embedSyncConfig(url: URL): EmbedSyncConfig | null {
	const syncId = url.searchParams.get('sync')?.trim();
	const role = embedSyncRole(url);

	if (!syncId || !role) return null;

	return {
		role,
		channelName: `xysynth:embed:${syncId}:v1`
	};
}

export function isSynthPlaybackState(value: unknown): value is SynthPlaybackState {
	if (!value || typeof value !== 'object') return false;

	const playback = value as Record<string, unknown>;
	return (
		typeof playback.playing === 'boolean' &&
		(playback.currentStep === null || Number.isInteger(playback.currentStep))
	);
}

export function synthPlaybackSnapshot(playback: SynthPlaybackState): SynthPlaybackState {
	return {
		playing: playback.playing,
		currentStep: playback.currentStep
	};
}

export function isEmbedSyncMessage(value: unknown): value is EmbedSyncMessage {
	if (!value || typeof value !== 'object') return false;

	const message = value as Record<string, unknown>;
	if (message.version !== 1) return false;
	if (message.type === 'request-state' || message.type === 'request-synth-state') return true;
	if (message.type === 'synth-state') {
		return typeof message.patch === 'string' && isSynthPlaybackState(message.playback);
	}
	if (message.type !== 'state' || !message.state || typeof message.state !== 'object') {
		return false;
	}

	const state = message.state as Record<string, unknown>;
	return (
		typeof state.tasks === 'string' &&
		Number.isInteger(state.taskId) &&
		Array.isArray(state.completed) &&
		state.completed.every((item) => typeof item === 'boolean') &&
		isSynthPlaybackState(state.playback)
	);
}
