<template>
  <div
    class="bg-white bg-opacity-95 p-5 rounded-lg shadow-md flex flex-col box-border hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
  >
    <div class="text-[#333] text-2xl" :class="{ 'mb-4': hasTitleSlot }">
      <slot name="title"></slot>
    </div>
    <div class="flex-1 flex flex-col">
      <slot></slot>
    </div>
    <div class="text-[#888] text-[13px]" :class="{ 'mt-3': hasFooterSlot }">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { useSlots, ref } from 'vue';
import { Comment } from 'vue';

const slots = useSlots();
const hasTitleSlot = ref(hasSlotContent(slots.title));
const hasFooterSlot = ref(hasSlotContent(slots.footer));

function hasSlotContent(slotFn) {
  if (!slotFn) return false;
  const vnodes = slotFn();
  return vnodes.some(
    (vnode) => vnode.type !== Comment && !(vnode.type === Text && vnode.children === ''),
  );
}
</script>
