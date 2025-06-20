<template>
  <Card>
    <template v-slot:title>扒谱工具</template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden">
      <PianoKeyboard class="w-16 flex-shrink-0" />
      <div class="flex flex-col flex-1 w-0">
        <PianoTimeLine
          :bars="bars"
          :barWidth="barWidth"
          :beatsPerBar="beatsPerBar"
          :tempo="tempo"
          :rowHeight="rowHeight"
        />
        <PianoGrid
          ref="pianoGrid"
          class="flex-1 overflow-auto"
          :bars="bars"
          :barWidth="barWidth"
          :beatsPerBar="beatsPerBar"
          :rows="rows"
          :rowHeight="rowHeight"
        />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PianoKeyboard from '../components/PianoKeyboard.vue';
import PianoGrid from '../components/PianoGrid.vue';
import PianoTimeLine from '../components/PianoTimeLine.vue';

const bars = 20;
const barWidth = 160;
const beatsPerBar = 4;
const rows = 88;
const rowHeight = 24;
const tempo = 60;
</script>
