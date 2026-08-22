<script>
import TimbreSynth from '$lib/components/TimbreSynth.svelte';
import { createDefaultSynthPatch } from '$lib/frontend/Synth';

let value = $state(createDefaultSynthPatch())
</script>

<TimbreSynth {value} />