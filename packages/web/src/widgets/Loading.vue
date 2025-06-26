<template>
  <transition name="fade">
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-gray-800/50 flex flex-col justify-center items-center z-50"
    >
      <svg
        class="animate-spin h-10 w-10 text-white mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="text-white text-lg">{{ text }}</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
  text: {
    type: String,
    default: '正在加载...',
  },
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
