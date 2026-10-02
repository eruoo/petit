<script setup lang="ts">
import { siteMetadata } from "#shared/site";
</script>

<template>
  <footer class="site-footer">
    <span>Petit · 星布谷地资料手册</span>
    <nav class="footer-links" aria-label="页脚导航">
      <NuxtLink to="/about">关于与信息来源</NuxtLink>
      <a :href="siteMetadata.repositoryUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>
  </footer>
</template>

<style scoped>
.site-footer {
  width: min(1344px, calc(100% - 96px));
  margin: 0 auto;
  padding: 1.8rem 0;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 20%, transparent);
  color: var(--petit-color-foreground-muted);
  font-size: 0.68rem;
}
.site-footer a {
  color: var(--petit-color-link);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
}
@media (max-width: 900px) {
  .site-footer {
    width: calc(100% - 48px);
  }
}
</style>
