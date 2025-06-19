<template>
  <Card>
    <template v-slot:title>扒谱工具</template>
    <div class="h-[90vh] w-full flex bg-gray-700 rounded-md overflow-hidden">
      <PianoKeyboard class="w-16 flex-shrink-0" />
      <PianoGrid class="flex-1 overflow-auto" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import PianoKeyboard from '../components/PianoKeyboard.vue';
import PianoGrid from '../components/PianoGrid.vue';
</script>
