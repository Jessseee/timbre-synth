<script lang="ts">
	import { onMount } from 'svelte';
	import type * as Tone from 'tone';

	let {
		analyser = null,
		class: className,
	} = $props<{
		analyser?: Tone.Analyser,
		class?: string
	}>();

	let canvas: HTMLCanvasElement;
	let raf = 0;

	function getWaveformData(analyser: Tone.Analyser): Float32Array | null {
		const value = analyser.getValue();

		if (value instanceof Float32Array) {
			return value;
		}

		if (Array.isArray(value) && value[0] instanceof Float32Array) {
			return value[0];
		}

		return null;
	}

	function draw() {
		if (!canvas || !analyser) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const render = () => {
			if (!canvas || !analyser) return;

			const data = getWaveformData(analyser);
			if (!data) {
				raf = requestAnimationFrame(render);
				return;
			}

			const { width, height } = canvas;

			ctx.clearRect(0, 0, width, height);

			ctx.beginPath();

			for (let i = 0; i < data.length; i++) {
				const x = (i / (data.length - 1)) * width;
				const y = ((1 - data[i]) * height) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}

			ctx.strokeStyle = '#51a2ff';
			ctx.lineWidth = 2;
			ctx.stroke();

			raf = requestAnimationFrame(render);
		};

		render();
	}

	$effect(() => {
		cancelAnimationFrame(raf);

		if (analyser && canvas) {
			draw();
		}

		return () => cancelAnimationFrame(raf);
	});

	onMount(() => {
		return () => cancelAnimationFrame(raf);
	});
</script>

<canvas
	bind:this={canvas}
	width="800"
	height="160"
	class="w-full h-40 border border-gray-200 rounded-xl shadow-sm bg-white {className}"
></canvas>