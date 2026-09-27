<script setup lang="ts">
import { useTemplateRef } from "vue";
import type { RecipeSource } from "#shared/recipes/schema";
import { useGuideImageViewer } from "../../composables/useGuideImageViewer";
import "viewerjs/dist/viewer.css";
import "../../assets/css/guide-image-viewer.css";

defineProps<{ guides: { source: RecipeSource; imageUrl: string }[] }>();

const gallery = useTemplateRef<HTMLElement>("gallery");
const { openPreview, loading, failed } = useGuideImageViewer(gallery);

function imageDateLabel(source: RecipeSource) {
  return source.imageDate.value ?? source.imageDate.raw;
}
</script>

<template>
  <div ref="gallery" :aria-busy="loading">
    <figure
      v-for="({ source, imageUrl }, index) in guides"
      :id="source.id"
      :key="source.id"
      class="recipe-guide"
    >
      <a
        class="guide-image-link"
        :href="imageUrl"
        :aria-label="`查看${source.creator}图鉴（${imageDateLabel(source)}）`"
        aria-haspopup="dialog"
        target="_blank"
        rel="noopener"
        @click.stop="openPreview($event, index)"
      >
        <img
          :src="imageUrl"
          :alt="`${source.titleRaw}（${imageDateLabel(source)}）`"
          :data-caption="`${source.creator} · 图片日期 ${imageDateLabel(source)}`"
          :width="source.asset.width"
          :height="source.asset.height"
          decoding="async"
        />
      </a>
      <figcaption>
        {{ source.creator }} · 图片日期 {{ imageDateLabel(source) }} · 点击图片放大 ·
        <a :href="imageUrl" target="_blank" rel="noopener">打开原图</a>
      </figcaption>
    </figure>
    <p v-if="loading" role="status">正在打开图片预览…</p>
    <p v-else-if="failed" role="status">图片预览暂时不可用，请通过“打开原图”查看。</p>
  </div>
</template>

<style scoped>
.recipe-guide {
  margin-top: 1.5rem;
  scroll-margin-top: 2rem;
}
.guide-image-link {
  display: block;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: zoom-in;
}
.guide-image-link img {
  display: block;
  width: 100%;
  height: auto;
}
.recipe-guide figcaption,
p {
  margin-top: 0.65rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  line-height: 1.7;
}
.recipe-guide figcaption a {
  color: var(--petit-color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
