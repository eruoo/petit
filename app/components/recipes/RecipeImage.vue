<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import type { DisplayRecipeImage } from "../../utils/recipe-images";
import type { RecipeQuality } from "../../../shared/recipes/qualities";
import RecipeIcon from "./RecipeIcon.vue";

const props = defineProps<{
  image?: DisplayRecipeImage;
  name: string;
  eager?: boolean;
  quality?: RecipeQuality;
}>();
const failed = shallowRef(false);
const imageElement = useTemplateRef<HTMLImageElement>("imageElement");
watch(
  () => props.image?.url,
  () => {
    failed.value = false;
  },
);
// 静态 HTML 的图片可能在水合前已失败，补查一次，避免留下破图。
onMounted(() => {
  const element = imageElement.value;
  if (element?.complete && element.naturalWidth === 0) failed.value = true;
});
const regionStyle = computed(() => {
  const image = props.image;
  const region = image?.displayRegion;
  if (!image || !region) return undefined;
  return {
    width: `${(image.width / region.width) * 100}%`,
    height: `${(image.height / region.height) * 100}%`,
    left: `${(-region.x / region.width) * 100}%`,
    top: `${(-region.y / region.height) * 100}%`,
  };
});
</script>

<template>
  <span
    class="recipe-image dish-quality"
    :class="{ 'guide-region': image?.displayRegion }"
    :data-quality="quality && quality.status !== 'unknown' ? quality.color : 'unknown'"
  >
    <img
      v-if="image && !failed"
      ref="imageElement"
      :src="image.url"
      :alt="`${name}（候选配图）`"
      :width="image.width"
      :height="image.height"
      :style="regionStyle"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      @error="failed = true"
    />
    <span v-else class="image-placeholder" role="img" :aria-label="`${name}：图片暂不可用`">
      <RecipeIcon name="pot" />
      <span>暂无图片</span>
    </span>
  </span>
</template>

<style scoped>
.recipe-image {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  isolation: isolate;
  border-radius: 16%;
  background: var(--dish-quality-background, var(--petit-color-surface-hover));
}
.recipe-image > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.guide-region > img {
  position: absolute;
  max-width: none;
}
.image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.6rem;
}
.image-placeholder svg {
  width: 24px;
  height: 24px;
  opacity: 0.6;
}
</style>
