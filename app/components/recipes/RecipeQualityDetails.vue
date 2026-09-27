<script setup lang="ts">
import { computed } from "vue";
import { qualityGuidesById } from "#shared/recipes/qualities";
import type { RecipeQuality } from "../../../shared/recipes/qualities";
import RecipeIcon from "./RecipeIcon.vue";

const props = defineProps<{ quality?: RecipeQuality }>();
const guide = computed(() =>
  props.quality && props.quality.status !== "unknown"
    ? qualityGuidesById.get(props.quality.source.guideId)
    : undefined,
);
</script>

<template>
  <section class="quality-source" aria-label="品质依据">
    <h3>品质依据</h3>
    <template v-if="quality && quality.status !== 'unknown' && guide">
      <p>
        TapTap · {{ guide.author }} · {{ guide.section }}第 {{ guide.imageNumber }} 张 · 第
        {{ quality.source.row }} 行，图标为{{ quality.backgroundRaw }}。
      </p>
      <p v-if="quality.status === 'tentative'">{{ quality.reason }}</p>
      <p>按玩家图鉴的底色记录品质，尚未在游戏中验证。</p>
      <div class="quality-source-links">
        <a :href="guide.postUrl" target="_blank" rel="noopener noreferrer">
          品质来源原帖<RecipeIcon name="external" />
        </a>
        <a :href="guide.imageUrl" target="_blank" rel="noopener noreferrer">
          查看品质原图<RecipeIcon name="external" />
        </a>
      </div>
    </template>
    <p v-else>{{ quality?.status === "unknown" ? quality.reason : "尚无对应的品质资料。" }}</p>
    <NuxtLink to="/about#dish-quality">查看品质说明<RecipeIcon name="arrow" /></NuxtLink>
  </section>
</template>

<style scoped>
.quality-source {
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  padding-top: 1.3rem;
  margin-top: 1.3rem;
}
.quality-source h3 {
  font-size: 0.85rem;
  font-weight: 750;
}
.quality-source p {
  font-size: 0.74rem;
  line-height: 1.9;
  color: var(--petit-color-foreground-muted);
  margin-top: 0.35rem;
}
.quality-source-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
}
.quality-source a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--petit-color-link);
  font-size: 0.74rem;
  padding: 0.55rem 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.quality-source svg {
  width: 13px;
  height: 13px;
}
</style>
