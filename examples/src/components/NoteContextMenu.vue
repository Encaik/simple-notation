<template>
  <div
    v-if="isVisible"
    :style="{ top: `${y}px`, left: `${x}px` }"
    class="note-context-menu absolute z-50 bg-white border border-gray-300 rounded shadow-md py-1 min-w-[100px] text-sm"
  >
    <div
      @click="onNoteCopy"
      class="menu-item px-4 py-2 cursor-pointer hover:bg-gray-200"
    >
      复制音符
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const { isVisible, x, y, noteData } = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  noteData: {
    type: [Object, null],
    default: () => ({}),
  },
});

const onNoteCopy = () => {
  if (noteData?.noteData) {
    navigator.clipboard.writeText(noteData.noteData);
  }
};

const emit = defineEmits(['close']);
</script>
