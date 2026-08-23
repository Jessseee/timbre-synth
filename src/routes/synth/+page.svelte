<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import TimbreSynth from '$lib/components/TimbreSynth.svelte';
	import {
		embedSyncConfig,
		embedSyncRole,
		isEmbedSyncMessage,
		isSynthPlaybackState,
		synthPlaybackSnapshot,
		type EmbedSyncMessage,
		type EmbedSyncRole
	} from '$lib/frontend/EmbedSync';
	import {
		createDefaultSynthPatch,
		paramNames,
		type SynthPlaybackState
	} from '$lib/frontend/Synth';
	import { descriptorNames, type SynthPatch } from '$lib/frontend/Task';
	import { onMount } from 'svelte';

	let value = $state(createDefaultSynthPatch());
	const initialUrl = browser ? new URL(window.location.href) : page.url;
	let syncRole: EmbedSyncRole | null = $state(embedSyncRole(initialUrl));
	let syncChannel: BroadcastChannel | undefined;
	let syncReady = $state(false);
	let playbackState: SynthPlaybackState = $state({ playing: false, currentStep: null });
	let readOnly = $derived(syncRole === 'display');

	function postSyncMessage(message: EmbedSyncMessage) {
		syncChannel?.postMessage(message);
	}

	function publishSynthState() {
		if (!syncReady || syncRole !== 'controller') return;

		try {
			postSyncMessage({
				version: 1,
				type: 'synth-state',
				patch: JSON.stringify(value),
				playback: synthPlaybackSnapshot(playbackState)
			});
		} catch {
			// A failed snapshot should not interrupt synth interaction.
		}
	}

	function handlePlaybackChange(playback: SynthPlaybackState) {
		if (syncRole === 'controller') {
			playbackState = playback;
		}
	}

	function isSynthPatch(patch: unknown): patch is SynthPatch {
		if (!patch || typeof patch !== 'object') return false;

		const candidate = patch as Record<string, unknown>;
		const params = candidate.params as Record<string, unknown> | undefined;
		const descriptors = candidate.descriptors as Record<string, unknown> | undefined;
		const notes = candidate.notes;

		return (
			!!params &&
			paramNames.every(
				(name) => typeof params[name] === 'number' && Number.isFinite(params[name])
			) &&
			!!descriptors &&
			descriptorNames.every(
				(name) => typeof descriptors[name] === 'number' && Number.isFinite(descriptors[name])
			) &&
			typeof candidate.pitch === 'number' &&
			Number.isFinite(candidate.pitch) &&
			Array.isArray(notes) &&
			notes.every(
				(note) =>
					!!note &&
					typeof note === 'object' &&
					((note as Record<string, unknown>).note === null ||
						(typeof (note as Record<string, unknown>).note === 'number' &&
							Number.isFinite((note as Record<string, unknown>).note))) &&
					typeof (note as Record<string, unknown>).dur === 'number' &&
					Number.isFinite((note as Record<string, unknown>).dur)
			)
		);
	}

	function applySynthState(serializedPatch: string, playback: unknown) {
		if (syncRole !== 'display') return;

		try {
			const patch: unknown = JSON.parse(serializedPatch);
			if (isSynthPatch(patch)) {
				value = patch;
			}
			if (isSynthPlaybackState(playback)) {
				playbackState = playback;
			}
		} catch {
			// Ignore malformed or stale messages and retain the last valid patch.
		}
	}

	function receiveSyncMessage(event: MessageEvent<unknown>) {
		if (!isEmbedSyncMessage(event.data)) return;

		if (event.data.type === 'request-synth-state') {
			publishSynthState();
		} else if (event.data.type === 'synth-state') {
			applySynthState(event.data.patch, event.data.playback);
		}
	}

	onMount(() => {
		const currentUrl = new URL(window.location.href);
		const syncConfig = embedSyncConfig(currentUrl);
		syncRole = embedSyncRole(currentUrl);

		if (syncConfig && 'BroadcastChannel' in window) {
			syncChannel = new BroadcastChannel(syncConfig.channelName);
			syncChannel.addEventListener('message', receiveSyncMessage);
			syncReady = true;

			if (syncConfig.role === 'controller') {
				publishSynthState();
			} else {
				postSyncMessage({ version: 1, type: 'request-synth-state' });
			}
		}

		return () => {
			syncReady = false;
			syncChannel?.removeEventListener('message', receiveSyncMessage);
			syncChannel?.close();
			syncChannel = undefined;
		};
	});

	$effect(() => {
		publishSynthState();
	});
</script>

<div inert={readOnly} data-embed-role={syncRole ?? undefined}>
	<TimbreSynth
		bind:value
		{readOnly}
		onPlaybackChange={handlePlaybackChange}
		mirroredPlayback={readOnly ? playbackState : undefined}
	/>
</div>
