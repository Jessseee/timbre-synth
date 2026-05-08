<script lang="ts" generics="TTask">
	import { enhance } from '$app/forms';
	import { turnstile } from '@svelte-put/cloudflare-turnstile';
	import type { Snippet } from 'svelte';

	type TaskContext<TTask> = {
		task: TTask;
		taskId: number;
		tasks: TTask[];
		markChanged: () => void;
		completed: boolean;
	};

	type ProgressContext<TTask> = {
		task: TTask;
		taskId: number;
		curTaskId: number;
		completed: boolean;
		current: boolean;
		visited: boolean;
	};

	type Props<TTask> = {
		initTasks: TTask[];
		form?: { error?: string } | null;

		intro?: Snippet;
		instructions?: Snippet<[TaskContext<TTask>]>;
		annotation: Snippet<[TaskContext<TTask>]>;
		progressDot?: Snippet<[ProgressContext<TTask>]>;

		endpoint?: string | null;
		status?: string;
		requireChange?: boolean;

		taskLabel?: (task: TTask, taskId: number, tasks: TTask[]) => string;

		turnstileSiteKey?: string | null;
		tasksFieldName?: string;
		turnstileTokenFieldName?: string;

		submitLabel?: string;
		verifyingLabel?: string;
		submittingLabel?: string;

		buildSubmitFormData?: (args: { formData: FormData; tasks: TTask[] }) => Promise<FormData>;
		onPageLeave?: () => void;
	};

	const turnstileSiteKey = '0x4AAAAAACES3HfA41jmS6z1';
	const turnstileTokenFieldName = 'cf-turnstile-token';

	let {
		initTasks,
		form,

		intro,
		instructions,
		annotation,
		progressDot,

		endpoint,
		requireChange = true,

		taskLabel = (_task, taskId, tasks) => `Task ${taskId + 1}/${tasks.length}`,

		tasksFieldName = 'tasks',
		submitLabel = 'Submit',
		verifyingLabel = 'Verifying...',
		submittingLabel = 'Submitting...',

		buildSubmitFormData,
		onPageLeave
	}: Props<TTask> = $props();

	let token = $state('');
	let started = $state(intro === undefined);
	let tasks: TTask[] = $state(initTasks);
	let curTaskId = $state(0);
	let completed: boolean[] = $state(initTasks.map(() => false));
	let submitting = $state(false);

	let curTask = $derived(tasks[curTaskId]);
	let currentCompleted = $derived(!requireChange || completed[curTaskId] === true);
	let turnstileReady = $derived(!turnstileSiteKey || token !== '');

	function markChanged() {
		completed[curTaskId] = true;
	}

	async function saveCurrentTask() {
		if (!endpoint || !curTask) return;

		await fetch(endpoint, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				tasks: [tasks[curTaskId]],
				status: 'pending'
			})
		});
	}

	async function nextTask() {
		if (curTaskId >= tasks.length - 1) return;

		await saveCurrentTask();
		curTaskId += 1;
		onPageLeave?.();
	}

	async function previousTask() {
		await saveCurrentTask();
		curTaskId = Math.max(0, curTaskId - 1);
		onPageLeave?.();
	}
</script>

<div class="p-5 lg:h-[calc(100vh-2em)] w-full xl:w-max mx-auto flex flex-wrap gap-4 justify-center">
	<div
		class="max-w-md max-h-full space-y-2 mb-10"
	>
		{#if !started}
			{@render intro?.()}

			<button
				onclick={() => (started = true)}
				class="rounded bg-blue-500 text-white px-4 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
			>
				Continue
			</button>
		{:else if curTask && instructions}
			{@render instructions({
				task: curTask,
				taskId: curTaskId,
				tasks,
				markChanged,
				completed: completed[curTaskId] === true
			})}
		{/if}
	</div>

	<div class="w-max space-y-4 flex flex-col">
		{#if started && curTask}
			<h2 class="text-xl font-bold -mb-2 ml-4">
				{taskLabel(curTask, curTaskId, tasks)}
			</h2>

			{@render annotation({
				task: curTask,
				taskId: curTaskId,
				tasks,
				markChanged,
				completed: completed[curTaskId] === true
			})}

			<div class="flex flex-col items-center">
				<div class="flex space-x-2 w-full">
					<button
						disabled={curTaskId === 0}
						onclick={previousTask}
						class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
					>
						<span class="icon-[carbon--previous-filled] text-lg -mb-1"></span> Previous
					</button>

					{#if curTaskId < tasks.length - 1}
						<button
							disabled={!currentCompleted}
							onclick={nextTask}
							class="w-full rounded bg-blue-500 text-white pl-3 pr-2 py-1 hover:bg-blue-700 hover:cursor-pointer disabled:cursor-default disabled:bg-blue-200"
						>
							Next <span class="icon-[carbon--next-filled] text-lg -mb-1"></span>
						</button>
					{:else}
						<form
							class="w-full"
							method="POST"
							use:enhance={async ({ formData }) => {
								submitting = true
								formData.append(tasksFieldName, JSON.stringify(tasks));

								if (turnstileSiteKey) {
									formData.append(turnstileTokenFieldName, token);
								}

								if (buildSubmitFormData !== undefined) {
									formData = await buildSubmitFormData({ formData, tasks });
								}
							}}
						>
							{#if turnstileSiteKey}
								<div
									use:turnstile
									turnstile-sitekey={turnstileSiteKey}
									onturnstile={(e) => (token = e.detail.token)}
								></div>
							{/if}

							<button
								disabled={!turnstileReady || !currentCompleted || submitting}
								type="submit"
								class="bg-green-500 p-2 py-1 rounded text-white font-bold hover:cursor-pointer hover:bg-green-600 w-full disabled:bg-green-300 disabled:cursor-default"
							>
								{#if turnstileReady}
									{#if submitting}
										{submittingLabel}
									{:else}
										{submitLabel}
										<span class="icon-[carbon--checkmark-filled] -mb-0.5"></span>
									{/if}
								{:else}
									{verifyingLabel}
								{/if}
							</button>
						</form>
					{/if}
				</div>

				{#if form?.error}
					<p class="text-sm mt-2 p-3 bg-red-100 rounded">
						<b class="mr-1">Error!</b> {form.error}
					</p>
				{/if}

				<div class="flex space-x-5 my-4">
					{#each tasks as task, taskId (taskId)}
						{#if progressDot}
							{@render progressDot({
								task,
								taskId,
								curTaskId,
								completed: completed[taskId] === true,
								current: curTaskId === taskId,
								visited: curTaskId >= taskId
							})}
						{:else}
							<div
								class:bg-blue-700={curTaskId >= taskId}
								class="w-[.5em] h-[.5em] shadow-sm ring-2 ring-blue-700 rounded"
							></div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>