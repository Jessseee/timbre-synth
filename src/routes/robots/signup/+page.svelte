<script lang="ts">
	import { enhance } from '$app/forms';

	const today = new Date().toLocaleDateString();
</script>

<svelte:head>
	<title>Timbre Thesis - Sign Up</title>
</svelte:head>

<div class="bg-gray-50">
	<div class="lg:h-screen grid lg:grid-cols-2 xl:w-[70vw] mx-auto gap-4 place-items-center p-6">
		<div
			class="lg:h-[calc(100vh-2em)] max-h-max max-w-xl rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-2 space-y-4"
		>
			<div class="max-h-full overflow-y-auto py-2 px-4 space-y-4">
				<h1 class="text-xl font-bold">Study: Sound Synthesis for HRI</h1>
				<section>
					<h2 class="text-lg font-bold">The project goal</h2>
					<p>
						The aim of this project is to develop a user interface to help users create the sounds for human-robot interaction (HRI).
					</p>
				</section>
				<section>
					<p>
						In this study, you will be asked to create sounds with the interface based on a description of a robot. During this experiment you will be asked to think aloud. Your voice and screen interactions will be recorded. Afterwards the researcher will also ask a few questions about your experience using the interface.
					</p>
				</section>
				<section>
					This research procedure was reviewed by the Ethics Committee
					Computer & Information Science. You will not be asked for any personally identifiable
					information. If you have any questions or remarks about the study or the consent form,
					please contact the
					<a class="text-blue-500 underline" href="j.w.visser-3@student.utwente.nl"> researcher </a>
					(Jesse Visser),
					<a class="text-blue-500 underline" href="mailto:k.p.truong@utwente.nl"> supervisor </a>
					(Khiet Truong) or
					<a class="text-blue-500 underline" href="mailto:ethicscommittee-cis@utwente.nl">
						Ethics Committee Computer & Information Science
					</a>
					(EC-CIS).
				</section>
			</div>
		</div>

		<form
			method="POST"
			use:enhance
			class="lg:h-[calc(100vh-2em)] max-h-max max-w-xl rounded-xl bg-white shadow-sm ring-1 p-2 ring-gray-200"
		>
			<div class="max-h-full overflow-y-auto py-2 px-4 space-y-4">
				<div>
					<h2 class="text-xl font-bold">Consent Form</h2>
					<p class="mb-2">
						To participate in this study please carefully read the following and consent by checking
						the checkboxes to the right.
					</p>
				</div>

				<div class="grid grid-cols-[80%_auto] gap-2 justify-items-start">
					<h2 class="text-md font-bold col-span-full mt-2">Informed participation</h2>
					<label class="hover:cursor-pointer" for="consent-0">
						I have read and understood the study information dated {today}
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-0" required />
					<label class="hover:cursor-pointer" for="consent-1"
						>I consent voluntarily to be a participant in this study and understand that I can refuse to answer questions and that I can stop my participation in the study at any time, without having to provide a reason.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-1" required />
					<label class="hover:cursor-pointer" for="consent-2">
						I understand that taking part in this study involves using a prototype synthesiser user interface.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-2" required />

					<h2 class="text-md font-bold col-span-full mt-2">Anonymous data entry</h2>
					<label class="hover:cursor-pointer" for="consent-3">
						I understand that <u>no</u> personal information will be shared about me that can identify me, such as my name, age, etc.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-3" required />
					<label class="hover:cursor-pointer" for="consent-4">
						I understand that the researcher will record my use of the prototype (audio/screen recording) and give permission for the use of anonymized transcripts of these recording in the reporting of this study and future scientific studies.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-4" required />
					<label class="hover:cursor-pointer" for="consent-5">
						I understand that any recordings of me made during this study will not be directly published and will be deleted permanently once analysed and transcribed.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-5" required />
				</div>
				<button
					type="submit"
					class="bg-blue-500 font-bold text-white text-lg px-2 py-1 rounded hover:bg-blue-700 hover:cursor-pointer"
				>
					Submit
				</button>
			</div>
		</form>
	</div>
</div>
