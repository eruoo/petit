<script setup lang="ts">
import SiteHeader from "../components/site/SiteHeader.vue";
import SiteFooter from "../components/site/SiteFooter.vue";
</script>

<template>
  <div class="site-layout">
    <a href="#main-content" class="skip-link">跳转到正文</a>
    <SiteHeader />
    <div class="site-content"><slot /></div>
    <SiteFooter />
  </div>
</template>

<style scoped>
.site-layout {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}
.site-content {
  flex: 1;
  min-width: 0;
}
.skip-link {
  position: fixed;
  z-index: 100;
  left: 1rem;
  top: 0.5rem;
  transform: translateY(-160%);
  padding: 0.8rem 1rem;
  background: var(--petit-color-primary);
  color: var(--petit-color-on-primary);
  border-radius: 0.5rem;
}
.skip-link:focus {
  transform: translateY(0);
}
</style>
