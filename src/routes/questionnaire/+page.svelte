<script>
	import { enhance } from '$app/forms';
	import Likert from '$lib/components/Likert.svelte';
	import { turnstile } from '@svelte-put/cloudflare-turnstile';

	let { form } = $props();

	let token = $state('');
	let questionnaire = $state('');
</script>

<svelte:head>
	<title>Timbre - Questionnaire</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<form
		class="mx-auto space-y-4 p-4"
		method="POST"
		use:enhance={({ formData }) => {
			formData.append('cf-turnstile-token', token);
		}}
	>
		<h1 class="font-bold text-xl mb-2">Post Annotation Questionnaire</h1>
		<p>
			Please fill in the following short questionnaire to let us know how you felt about these
			annotation tasks.
		</p>
		<Likert required name="questionnaire[0]">I found the tasks difficult to complete.</Likert>
		<Likert required name="questionnaire[1]">The sounds were clearly distinguishable.</Likert>
		<label class="text-center block mb-1 relative">
			<span class="block mb-1 font-medium"
				>If you want, please elaborate on how you felt about completing these annotation tasks.</span
			>
			<textarea
				name="questionnaire[2]"
				bind:value={questionnaire}
				maxlength="1000"
				class="h-[5em] max-h-50 min-h-[3em] border border-gray-500 rounded w-full p-2 text-sm"
			></textarea>
			<p class="text-xs text-end absolute bottom-3 right-2 text-gray-600">
				{questionnaire.length}/1000
			</p>
		</label>
		<p class="text-sm px-3 py-2 bg-orange-100 rounded">
			<b class="mr-1">Note!</b> Please do not put personal information in the text field.
		</p>
		<div
			use:turnstile
			turnstile-sitekey="0x4AAAAAACES3HfA41jmS6z1"
			onturnstile={(e) => (token = e.detail.token)}
		></div>
		<div class="grid grid-cols-3 gap-4">
			<button
				disabled={token === ''}
				type="submit"
				class="bg-green-500 col-span-2 p-2 rounded text-white font-bold hover:cursor-pointer hover:bg-green-600 w-full disabled:bg-green-300 disabled:cursor-default"
			>
				{token ? 'Submit' : 'Verifying...'}
			</button>
			<a
				href="/done"
				class="col-span-1 text-center bg-gray-500 text-white p-2 rounded font-bold hover:cursor-pointer hover:bg-gray-700 w-full disabled:bg-green-300 disabled:cursor-default"
			>
				Skip
			</a>
		</div>
		{#if form?.error}
			<p class="text-sm p-3 bg-red-100 rounded"><b class="mr-1">Error!</b> {form.error}</p>
		{/if}
	</form>
</div>
