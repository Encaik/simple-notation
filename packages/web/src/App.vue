<template>
  <Header />
  <!-- 网站介绍面板 -->
  <PanelAbout />
  <router-view v-slot="{ Component }">
    <keep-alive include="Home">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import Header from './components/Header.vue';
import PanelAbout from './components/PanelAbout.vue';
</script>
