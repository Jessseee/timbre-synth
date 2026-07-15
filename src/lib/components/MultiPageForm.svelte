<script lang="ts" generics="TTask">
	import { afterNavigate, goto, pushState, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount, type Snippet } from 'svelte';

	type TaskContext<TTask> = {
		task: TTask;
		taskId: number;
		tasks: TTask[];
		markChanged: () => void;
		completed: boolean;
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

	let curTask = $derived(tasks[curTaskId]);
	let currentCompleted = $derived(completed[curTaskId] === true);

	function markChanged() {
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
		const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

		if (nextHref === currentHref) return;

		if (mode === 'push') {
			pushState(nextHref, {});
		} else {
			replaceState(nextHref, {});
		}
	}

	function goToTask(taskId: number, mode: 'push' | 'replace' = 'push') {
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
		if (!currentCompleted || submitting) return;

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
		function syncTaskFromLocation() {
			const taskId = taskIdFromUri(currentBrowserUrl());
			if (taskId !== null) {
				curTaskId = taskId;
			}
		}

		restoreTasks();
		syncTaskFromLocation();

		window.addEventListener('popstate', syncTaskFromLocation);

		return () => {
			window.removeEventListener('popstate', syncTaskFromLocation);
		};
	});

	$effect(() => {
		if (!browser) return;

		const taskId = taskIdFromUri(currentBrowserUrl());

		if (taskId !== null) {
			curTaskId = taskId;
		}
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

<div class="p-5 lg:h-[calc(100vh-2em)] w-full xl:w-max mx-auto flex flex-wrap gap-4 justify-center">
	<div class="max-w-md space-y-2">
		{#if curTask}
			{@render instructions({
				task: curTask,
				taskId: curTaskId,
				tasks,
				markChanged,
				completed: completed[curTaskId] === true
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
				completed: completed[curTaskId] === true
			})}

			<div class="hidden xl:flex flex-col items-center">
				{@render navigationButtons()}
				{@render progressPips()}
			</div>
		{/if}
	</div>
</div>
