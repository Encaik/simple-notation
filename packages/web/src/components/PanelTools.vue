<template>
  <Card class="max-w-[1200px] w-full mt-5 mx-auto">
    <div class="flex flex-row flex-wrap items-center gap-[10px]">
      <Button @click="goToPianoRoll">🎹编曲工具(通过编曲快速生成乐谱)</Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from '../widgets/Button.vue';
import Card from '../widgets/Card.vue';

const router = useRouter();

/**
 * 跳转到编曲工具页面
 */
const goToPianoRoll = () => {
  router.push('/piano-roll');
};
</script>
