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
				<h1 class="text-xl font-bold">Study: Timbre Guided Sound Synthesis</h1>
				<section>
					<h2 class="text-lg font-bold">The project goal</h2>
					<p>
						The aim of this project is to develop a user interface for sound synthesis guided by
						timbre descriptions (brightness, roughness and resonance).
					</p>
				</section>
				<section>
					<p class="text-sm p-3 bg-gray-100 rounded">
						<b>Timbre (noun):</b> The quality of sound which allows one to distinguish two particular
						sources producing sound at the same pitch and loudness (e.g. the difference in sound between
						a flute and a horn playing the same note at the same volume).
					</p>
				</section>
				<section>
					<h2 class="text-lg font-bold">Our approach</h2>
					<p>
						To accomplish this, we will train two neural networks that learn the relationship
						between the timbre of a sound and the synthesizer settings that create them. With these
						networks we can then create a simplified interface for the synthesiser, guided by
						timbre.
					</p>
				</section>
				<section class="space-y-2">
					<h2 class="text-lg font-bold mb-1">How you can help</h2>
					<p>
						To be able to create this sound timbre dataset, you will be asked to take on several
						annotation tasks. In each task you will rank a small number of sounds on a timbre
						descriptor, either brightness, roughness or resonance.
					</p>
					<p>
						For example, you will be asked to rank sounds from most to least bright by interactively
						rearranging the sounds from top to bottom in a list. You may play the sounds as many
						times as you need to determine the best ranking. The sounds consist of a short
						continuous sequence of tones. There will be example sounds and written explanations to
						help you understand the different timbre descriptors.
					</p>
					<p>
						You will be given 15 ranking tasks, please schedule roughly 30 minutes to complete these
						tasks. You can stop at any moment and you can also continue your tasks at a later time,
						by opening this web page again in the same browser on the same device. If you are
						willing to commit more of your time, you can request another set of tasks after
						submitting the ones assigned to you. At the end, you will also be asked to <em
							>optionally</em
						> fill in a short questionnaire about your experience with these tasks.
					</p>
					<p class="text-sm p-3 bg-orange-100 rounded">
						<b>Note!</b> To participate please wear a decent pair of <u>headphones / earbuds</u>, so
						you will be able to hear the sounds well.
					</p>
				</section>
				<section>
					This research procedure is completely anonymous, and was reviewed by the Ethics Committee
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
						>I consent voluntarily to be a participant in this study and understand that I can
						refuse to answer questions and that I can stop my participation in the study at any
						time, without having to provide a reason.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-1" required />
					<label class="hover:cursor-pointer" for="consent-2">
						I understand that taking part in the study involves ranking sounds by timbre descriptors
						(brightness, roughness and resonance)
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-2" required />

					<h2 class="text-md font-bold col-span-full mt-2">Anonymous data entry</h2>
					<label class="hover:cursor-pointer" for="consent-3">
						I understand that the information I provide is anonymous and that I can therefore not
						fully withdraw my consent for the use of this information.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-3" required />
					<label class="hover:cursor-pointer" for="consent-4">
						I understand that <u>no</u> personal information will be collected about me that can identify
						me, such as my name, location, age, etc.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-4" required />
					<label class="hover:cursor-pointer" for="consent-5">
						I understand that at the end of the tasks there will be an <u>optional</u> anonymous questionnaire
						about my experience with these ranking tasks.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-5" required />

					<h2 class="text-md font-bold col-span-full mt-2">
						Future use of the information in this study
					</h2>
					<label class="hover:cursor-pointer" for="consent-6">
						I understand that information I provide will be used to create a dataset of synthesised
						sounds ranked by timbre, used to train machine learning models to create a synthesiser
						user interface guided by timbre descriptors.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-6" required />
					<label class="hover:cursor-pointer" for="consent-7">
						I give permission for the anonymous sound rankings that I provide to be publicly
						archived so it can be used for future research and learning.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-7" required />
					<label class="hover:cursor-pointer" for="consent-8">
						I give permission for the optional anonymous questionnaire about these ranking tasks to
						be used to evaluate the experiment and my answers to be anonymously quoted in the
						research report.
					</label>
					<input class="hover:cursor-pointer mx-auto w-4" type="checkbox" id="consent-8" required />
				</div>

				<p class="text-sm p-3 bg-gray-100 rounded">
					<b>Reminder!</b> By pressing the "submit" button you consent to the use of the (partial)
					annotations you provide, <u>without</u> the option to withdraw this consent, as the data is
					collected anonymously and cannot be traced back to you.
				</p>

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
