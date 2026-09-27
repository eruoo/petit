<script setup lang="ts">
import AboutSources from "./AboutSources.vue";
</script>

<template>
  <main id="main-content" class="about-main" tabindex="-1">
    <header class="about-heading">
      <p class="about-eyebrow">星布谷地 · 烹饪手册</p>
      <h1>关于 Petit</h1>
      <p class="about-intro">一份非官方的《星布谷地》菜谱速查手册，方便玩家查找配方。</p>
    </header>
    <AboutSources />
    <section class="copyright-note" aria-labelledby="copyright-heading">
      <h2 id="copyright-heading">版权说明</h2>
      <p>
        本站仅供玩家查阅交流，图片和资料版权归原作者及相关权利人所有。
        无意侵犯任何权益，如有侵权，请告知，我们将及时核实并删除或调整。
      </p>
    </section>
    <NuxtLink to="/" class="back-to-recipes">返回菜谱速查 →</NuxtLink>
  </main>
</template>

<style scoped>
.about-main {
  max-width: 880px;
  margin: 0 auto;
  padding: 2.8rem 48px 3rem;
}
.about-heading {
  margin-bottom: 2rem;
}
.about-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: var(--petit-color-foreground-muted);
}
.about-heading h1 {
  margin-top: 0.8rem;
  color: var(--petit-color-foreground-heading);
  font-size: clamp(1.85rem, 3vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.about-intro {
  margin-top: 0.9rem;
  font-size: 0.9rem;
  line-height: 1.9;
}
.copyright-note {
  padding-top: 1.5rem;
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  margin-top: 1.75rem;
}
.copyright-note h2 {
  font-size: 1rem;
  font-weight: 750;
  color: var(--petit-color-foreground-heading);
}
.copyright-note p {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  line-height: 1.9;
  color: var(--petit-color-foreground-muted);
}
.back-to-recipes {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.6rem 0;
  color: var(--petit-color-link);
  font-size: 0.83rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}
@media (max-width: 600px) {
  .about-main {
    padding: 2rem 24px;
  }
}
</style>
