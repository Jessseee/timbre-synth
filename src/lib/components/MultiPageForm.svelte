<script lang="ts" generics="TTask">
	import { afterNavigate, goto, pushState, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import {
		embedSyncConfig,
		embedSyncRole,
		isEmbedSyncMessage,
		synthPlaybackSnapshot,
		type EmbedSyncMessage,
		type EmbedSyncRole,
		type EmbedSyncState
	} from '$lib/frontend/EmbedSync';
	import type { SynthPlaybackState } from '$lib/frontend/Synth';
	import { onMount, type Snippet } from 'svelte';

	type TaskContext<TTask> = {
		task: TTask;
		taskId: number;
		tasks: TTask[];
		markChanged: () => void;
		completed: boolean;
		readOnly: boolean;
		playbackState: SynthPlaybackState;
		onPlaybackChange: (playback: SynthPlaybackState) => void;
	};

	type Props<TTask> = {
		initTasks: TTask[];

		instructions: Snippet<[TaskContext<TTask>]>;
		annotation: Snippet<[TaskContext<TTask>]>;

		taskLabel?: (task: TTask, taskId: number, tasks: TTask[]) => string;
		taskUri?: (task: TTask, taskId: number, tasks: TTask[]) => string | URL;
		taskIndexFromUri?: (url: URL, tasks: TTask[]) => number | null | undefined;
		taskStorageKey?: string;
		serializeTaskState?: (tasks: TTask[]) => string;
		deserializeTaskState?: (stored: string, tasks: TTask[]) => TTask[];

		submitLabel?: string;
		submittingLabel?: string;
		previousLabel?: string;
		nextLabel?: string;
	};

	let {
		initTasks,
		instructions,
		annotation,

		taskLabel = (_task, taskId, tasks) => `Task ${taskId + 1}/${tasks.length}`,
		taskUri,
		taskIndexFromUri,
		taskStorageKey,
		serializeTaskState,
		deserializeTaskState,

		submitLabel = 'Submit',
		submittingLabel = 'Submitting...',
		previousLabel = 'Previous',
		nextLabel = 'Next'
	}: Props<TTask> = $props();

	function initialTasks() {
		return initTasks;
	}

	function initialCompleted() {
		return initTasks.map(() => false);
	}

	function clampTaskId(taskId: number) {
		return Math.min(Math.max(0, taskId), Math.max(0, initTasks.length - 1));
	}

	function taskIdFromUri(url: URL) {
		if (!taskIndexFromUri) return null;

		const taskId = taskIndexFromUri(url, initTasks);
		if (typeof taskId !== 'number' || !Number.isFinite(taskId)) return null;

		return clampTaskId(taskId);
	}

	function currentBrowserUrl() {
		if (!browser) return page.url;
		return new URL(window.location.href);
	}

	let tasks: TTask[] = $state(initialTasks());
	let curTaskId = $state(0);
	let completed: boolean[] = $state(initialCompleted());
	let submitting = $state(false);
	let initializedTaskUri = false;
	const initialUrl = browser ? new URL(window.location.href) : page.url;
	let syncRole: EmbedSyncRole | null = $state(embedSyncRole(initialUrl));
	let syncChannel: BroadcastChannel | undefined;
	let syncReady = $state(false);
	let playbackState: SynthPlaybackState = $state({ playing: false, currentStep: null });

	let curTask = $derived(tasks[curTaskId]);
	let currentCompleted = $derived(completed[curTaskId] === true);
	let readOnly = $derived(syncRole === 'display');

	function onPlaybackChange(playback: SynthPlaybackState) {
		if (syncRole === 'controller') {
			playbackState = playback;
		}
	}

	function markChanged() {
		if (readOnly) return;

		completed[curTaskId] = true;
		persistTasks();
	}

	function persistTasks() {
		if (!browser || !taskStorageKey) return;

		try {
			localStorage.setItem(taskStorageKey, serializeTaskState?.(tasks) ?? JSON.stringify(tasks));
		} catch {
			// Persisting task state is best-effort; form interaction should keep working.
		}
	}

	function restoreTasks() {
		if (!browser || !taskStorageKey) return;

		try {
			const stored = localStorage.getItem(taskStorageKey);
			if (!stored) return;

			tasks = deserializeTaskState?.(stored, tasks) ?? JSON.parse(stored);
		} catch {
			localStorage.removeItem(taskStorageKey);
		}
	}

	function setTaskUri(taskId: number, mode: 'push' | 'replace') {
		if (!taskUri || tasks.length === 0) return;

		const href = taskUri(tasks[taskId], taskId, tasks);
		const currentUrl = currentBrowserUrl();
		const currentHref = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
		const nextUrl = new URL(href, currentUrl);

		// Task navigation owns the task parameter, not the presentation connection.
		// Keep the latter in the iframe URL so reloads retain their assigned role.
		for (const parameter of ['sync', 'role']) {
			if (!nextUrl.searchParams.has(parameter) && currentUrl.searchParams.has(parameter)) {
				nextUrl.searchParams.set(parameter, currentUrl.searchParams.get(parameter) ?? '');
			}
		}

		const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

		if (nextHref === currentHref) return;

		if (mode === 'push') {
			pushState(nextHref, {});
		} else {
			replaceState(nextHref, {});
		}
	}

	function goToTask(taskId: number, mode: 'push' | 'replace' = 'push') {
		if (readOnly) return;

		curTaskId = clampTaskId(taskId);
		setTaskUri(curTaskId, mode);
	}

	function nextTask() {
		if (curTaskId >= tasks.length - 1) return;

		goToTask(curTaskId + 1);
	}

	function previousTask() {
		goToTask(curTaskId - 1);
	}

	async function submitTasks() {
		if (readOnly || !currentCompleted || submitting) return;

		submitting = true;

		try {
			await goto('done');
		} finally {
			submitting = false;
		}
	}

	afterNavigate(() => {
		if (initializedTaskUri) return;

		initializedTaskUri = true;
		const taskId = taskIdFromUri(currentBrowserUrl());
		if (taskId !== null) {
			curTaskId = taskId;
		}

		setTaskUri(curTaskId, 'replace');
	});

	onMount(() => {
		const syncConfig = embedSyncConfig(currentBrowserUrl());
		syncRole = embedSyncRole(currentBrowserUrl());

		function syncTaskFromLocation() {
			const taskId = taskIdFromUri(currentBrowserUrl());
			if (taskId !== null) {
				curTaskId = taskId;
			}
		}

		if (!readOnly) {
			restoreTasks();
		}
		syncTaskFromLocation();

		window.addEventListener('popstate', syncTaskFromLocation);

		if (syncConfig && 'BroadcastChannel' in window) {
			syncChannel = new BroadcastChannel(syncConfig.channelName);
			syncChannel.addEventListener('message', receiveSyncMessage);
			syncReady = true;

			if (syncConfig.role === 'controller') {
				publishSyncState();
			} else {
				postSyncMessage({ version: 1, type: 'request-state' });
			}
		}

		return () => {
			window.removeEventListener('popstate', syncTaskFromLocation);
			syncReady = false;
			syncChannel?.removeEventListener('message', receiveSyncMessage);
			syncChannel?.close();
			syncChannel = undefined;
		};
	});

	function postSyncMessage(message: EmbedSyncMessage) {
		syncChannel?.postMessage(message);
	}

	function currentSyncState(): EmbedSyncState | null {
		try {
			return {
				tasks: serializeTaskState?.(tasks) ?? JSON.stringify(tasks),
				taskId: curTaskId,
				completed: [...completed],
				playback: synthPlaybackSnapshot(playbackState)
			};
		} catch {
			return null;
		}
	}

	function publishSyncState() {
		if (!syncReady || syncRole !== 'controller') return;

		const state = currentSyncState();
		if (state) {
			postSyncMessage({ version: 1, type: 'state', state });
		}
	}

	function applySyncState(state: EmbedSyncState) {
		if (syncRole !== 'display') return;

		try {
			const nextTasks = deserializeTaskState?.(state.tasks, tasks) ?? JSON.parse(state.tasks);
			if (!Array.isArray(nextTasks) || nextTasks.length !== tasks.length) return;

			tasks = nextTasks;
			completed = tasks.map((_, index) => state.completed[index] === true);
			playbackState = state.playback;
			curTaskId = clampTaskId(state.taskId);
			setTaskUri(curTaskId, 'replace');
		} catch {
			// Ignore malformed or stale messages and keep the last valid display state.
		}
	}

	function receiveSyncMessage(event: MessageEvent<unknown>) {
		if (!isEmbedSyncMessage(event.data)) return;

		if (event.data.type === 'request-state') {
			publishSyncState();
		} else if (event.data.type === 'state') {
			applySyncState(event.data.state);
		}
	}

	$effect(() => {
		if (!browser) return;

		const taskId = taskIdFromUri(currentBrowserUrl());

		if (taskId !== null) {
			curTaskId = taskId;
		}
	});

	$effect(() => {
		publishSyncState();
	});
</script>

{#snippet navigationButtons()}
	<div class="flex space-x-2 w-full">
		<button
			disabled={curTaskId === 0}
			onclick={previousTask}
			class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
		>
			<span class="icon-[carbon--previous-filled] text-lg -mb-1"></span>
			{previousLabel}
		</button>

		{#if curTaskId < tasks.length - 1}
			<button
				disabled={!currentCompleted}
				onclick={nextTask}
				class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
			>
				{nextLabel} <span class="icon-[carbon--next-filled] text-lg -mb-1"></span>
			</button>
		{:else}
			<div class="w-full">
				<button
					disabled={!currentCompleted || submitting}
					type="button"
					onclick={submitTasks}
					class="bg-green-500 p-2 py-1 rounded text-white font-bold hover:cursor-pointer hover:bg-green-600 w-full disabled:bg-green-300 disabled:cursor-default"
				>
					{#if submitting}
						{submittingLabel}
					{:else}
						{submitLabel}
						<span class="icon-[carbon--checkmark-filled] -mb-0.5"></span>
					{/if}
				</button>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet progressPips()}
	<div class="flex space-x-5 mt-4">
		{#each tasks as _, taskId (taskId)}
			<div
				class:bg-blue-700={curTaskId >= taskId}
				class="w-[.5em] h-[.5em] shadow-sm ring-2 ring-blue-700 rounded"
			></div>
		{/each}
	</div>
{/snippet}

<div
	inert={readOnly}
	data-embed-role={syncRole ?? undefined}
	class="p-5 lg:h-[calc(100vh-2em)] w-full xl:w-max mx-auto flex flex-wrap gap-4 justify-center"
>
	<div class="max-w-md space-y-2">
		{#if curTask}
			{@render instructions({
				task: curTask,
				taskId: curTaskId,
				tasks,
				markChanged,
				completed: completed[curTaskId] === true,
				readOnly,
				playbackState,
				onPlaybackChange
			})}
		{/if}

		{#if curTask}
			<div class="xl:hidden flex flex-col items-center">
				{@render navigationButtons()}
				{@render progressPips()}
			</div>
		{/if}
	</div>

	<div class="w-max space-y-4 flex flex-col">
		{#if curTask}
			{@render annotation({
				task: curTask,
				taskId: curTaskId,
				tasks,
				markChanged,
				completed: completed[curTaskId] === true,
				readOnly,
				playbackState,
				onPlaybackChange
			})}

			<div class="hidden xl:flex flex-col items-center">
				{@render navigationButtons()}
				{@render progressPips()}
			</div>
		{/if}
	</div>
</div>
