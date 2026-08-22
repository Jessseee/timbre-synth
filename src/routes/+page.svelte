<script lang="ts">
	import MultiPageForm from '$lib/components/MultiPageForm.svelte';
	import TimbreSynth from '$lib/components/TimbreSynth.svelte'
	import {
		type RobotTask,
		type SynthPatch
	} from '$lib/frontend/Task';
	import { createDefaultSynthPatch } from '$lib/frontend/Synth';
	import * as m from '$lib/paraglide/messages';

	const taskStorageKey = 'xysynth:robot-sounds:v1';

	const robots = [
		{
			id: 'small-private',
			imageUrl: '/robots/small-private.png',
			icon: 'icon-[carbon--clean]',
			name: () => m.robots_cleaning_name(),
			summary: () => m.robots_cleaning_summary(),
			description: () => m.robots_cleaning_description()
		},
		{
			id: 'large-private',
			imageUrl: '/robots/large-private.png',
			icon: 'icon-[carbon--home]',
			name: () => m.robots_home_service_name(),
			summary: () => m.robots_home_service_summary(),
			description: () => m.robots_home_service_description()
		},
		{
			id: 'small-public',
			imageUrl: '/robots/small-public.png',
			icon: 'icon-[carbon--trash-can]',
			name: () => m.robots_trashcan_name(),
			summary: () => m.robots_trashcan_summary(),
			description: () => m.robots_trashcan_description()
		},
		{
			id: 'large-public',
			imageUrl: '/robots/large-public.jpg',
			icon: 'icon-[carbon--delivery]',
			name: () => m.robots_delivery_name(),
			summary: () => m.robots_delivery_summary(),
			description: () => m.robots_delivery_description()
		}
	];

	const tasks: RobotTask[] = robots.map((robot) => ({
		id: robot.id,
		robot,
		sound: createDefaultSynthPatch(),
		soundId: null
	}));

	function robotCopy(task: RobotTask) {
		return {
			name: task.robot.name(),
			summary: task.robot.summary(),
			description: task.robot.description()
		};
	}

	function robotTaskUri(task: RobotTask) {
		return `?robot=${task.id}`;
	}

	function robotTaskIndexFromUri(url: URL, tasks: RobotTask[]) {
		const robotId = url.searchParams.get('robot');
		if (!robotId) return null;

		const taskIndex = tasks.findIndex((task) => task.id === robotId);
		return taskIndex === -1 ? null : taskIndex;
	}

	function serializeRobotTaskState(tasks: RobotTask[]) {
		return JSON.stringify(
			Object.fromEntries(tasks.map((task) => [task.id, task.sound] satisfies [string, SynthPatch]))
		);
	}

	function deserializeRobotTaskState(stored: string, tasks: RobotTask[]) {
		const sounds = JSON.parse(stored) as Record<string, SynthPatch | undefined>;

		return tasks.map((task) => ({
			...task,
			sound: sounds[task.id] ?? task.sound
		}));
	}
</script>

<MultiPageForm
	initTasks={tasks}
	taskUri={robotTaskUri}
	taskIndexFromUri={robotTaskIndexFromUri}
	{taskStorageKey}
	serializeTaskState={serializeRobotTaskState}
	deserializeTaskState={deserializeRobotTaskState}
	previousLabel={m.robots_previous()}
	nextLabel={m.robots_next()}
	submitLabel={m.robots_submit()}
	submittingLabel={m.robots_submitting()}
>
	{#snippet instructions({ task })}
		{@const copy = robotCopy(task)}
		<img
			src={task.robot.imageUrl}
			alt={copy.name}
			class="rounded-xl shadow-sm ring-1 ring-gray-200"
		/>
		<div class="bg-gray-100 p-4 rounded-xl shadow-sm ring-1 ring-gray-200">
			<h3 class="font-bold text-lg mb-2">{copy.name}</h3>
			<p class="max-w-md mb-2 font-medium">
				<span class="{task.robot.icon} -mb-1 text-xl mr-1 text-blue-600" aria-hidden="true"
				></span>{copy.summary}
			</p>
			<p class="max-w-md items-start gap-2">
				<span>{copy.description}</span>
			</p>
		</div>
		<div class="bg-blue-100 p-4 rounded-xl shadow-sm ring-1 ring-gray-200">
			<h3 class="font-bold text-lg mb-2 flex items-center gap-2">
				<span class="icon-[carbon--music] text-xl text-blue-600" aria-hidden="true"></span>
				{m.robots_signal_heading()}
			</h3>
			<p class="max-w-md">{@html m.robots_signal_prompt()}</p>
			<p class="my-3 text-center font-bold">"{m.robots_signal_quote()}"</p>
			<p class="max-w-md">{m.robots_signal_hint()}</p>
		</div>
	{/snippet}

	{#snippet annotation({ task, taskId, markChanged })}
		{#key taskId}
			<TimbreSynth bind:value={task.sound} onChange={markChanged} />
		{/key}
	{/snippet}
</MultiPageForm>
