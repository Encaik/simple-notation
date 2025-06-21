<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-center items-center">
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      @mousedown.stop
    >
      <div class="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '模态框',
  },
});

const emit = defineEmits(['update:isOpen']);

function closeModal() {
  emit('update:isOpen', false);
}
</script>
