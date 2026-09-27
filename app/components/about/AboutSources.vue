<script setup lang="ts">
import { recipeDataset } from "#shared/recipes/index";
import wikiArchive from "../../../docs/references/recipes/wiki-dish-icons-2026-09-26.json";
import taptapArchive from "../../../docs/references/recipes/taptap-recipe-guides-2026-09-26.json";
import { getRecipeSourceImageUrl } from "../../utils/recipe-sources";
import RecipeIcon from "../recipes/RecipeIcon.vue";

const source = recipeDataset.sources.find(
  (entry) => entry.id === recipeDataset.inventory.sourceId,
)!;
const latestImageUrl = getRecipeSourceImageUrl(source);
const taptapAuthors = [...new Set(taptapArchive.files.map((file) => file.author))].join("、");
const taptapPosts = [
  ...new Map(
    taptapArchive.files.map((file) => [
      file.postUrl,
      { url: file.postUrl, title: `${file.guideSection}篇` },
    ]),
  ).values(),
];
</script>

<template>
  <div class="about-sources">
    <section aria-labelledby="sources-heading">
      <h2 id="sources-heading">菜谱资料来源</h2>
      <p>菜谱整理自用户提供的《{{ source.titleRaw }}》。</p>
      <figure :id="source.id" class="latest-guide">
        <a
          class="guide-image-link"
          :href="latestImageUrl"
          :aria-label="`查看最新版图鉴（${source.imageDate.value}）`"
          target="_blank"
          rel="noopener"
        >
          <img
            :src="latestImageUrl"
            :alt="`${source.titleRaw}（${source.imageDate.value}）`"
            :width="source.asset.width"
            :height="source.asset.height"
            decoding="async"
          />
        </a>
        <figcaption>最新版图鉴 · 图片标注 {{ source.imageDate.value }} · 点击查看原图</figcaption>
      </figure>
    </section>
    <section aria-labelledby="image-sources-heading">
      <h2 id="image-sources-heading">图片来源</h2>
      <p>
        菜品图标主要来自 Petit Planet Wiki；部分配图取自 TapTap 作者「{{
          taptapAuthors
        }}」的菜谱图鉴，展示其中对应的菜品图标区域。
      </p>
      <p id="dish-quality" class="quality-source-summary">品质颜色参考 TapTap 图鉴。</p>
      <div class="source-links">
        <a :href="wikiArchive.wikiCatalogUrl" target="_blank" rel="noopener noreferrer">
          Wiki 菜品图标目录<RecipeIcon name="external" />
        </a>
        <a
          v-for="post in taptapPosts"
          :key="post.url"
          :href="post.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          TapTap {{ post.title }}<RecipeIcon name="external" />
        </a>
      </div>
    </section>
    <section aria-labelledby="thanks-heading">
      <h2 id="thanks-heading">特别致谢</h2>
      <p>
        感谢 {{ source.creator }} 制作菜谱图鉴，Petit Planet Wiki 社区整理菜品图标，以及 TapTap
        作者「{{ taptapAuthors }}」分享攻略与配图。
      </p>
    </section>
  </div>
</template>

<style scoped>
.about-sources > section + section {
  padding-top: 1.5rem;
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  margin-top: 1.75rem;
}
.about-sources h2 {
  font-size: 1rem;
  font-weight: 750;
  color: var(--petit-color-foreground-heading);
}
.about-sources p {
  margin-top: 0.6rem;
  font-size: 0.83rem;
  line-height: 1.9;
}
.quality-source-summary,
.latest-guide {
  scroll-margin-top: 2rem;
}
.source-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.25rem;
  margin-top: 0.6rem;
}
.source-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0;
  color: var(--petit-color-link);
  font-size: 0.75rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.source-links svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.latest-guide {
  margin-top: 1.5rem;
}
.guide-image-link {
  display: block;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  border-radius: 0.5rem;
  overflow: hidden;
}
.guide-image-link img {
  display: block;
  width: 100%;
  height: auto;
}
.latest-guide figcaption {
  margin-top: 0.65rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  line-height: 1.7;
}
</style>
