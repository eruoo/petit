<script setup lang="ts">
import { currentRecipeSources } from "#shared/recipes/current";
import wikiArchive from "../../../docs/references/recipes/wiki-dish-icons-2026-09-26.json";
import taptapArchive from "../../../docs/references/recipes/taptap-recipe-guides-2026-09-26.json";
import { getRecipeSourceImageUrl } from "../../utils/recipe-sources";
import RecipeIcon from "../recipes/RecipeIcon.vue";
import GuideImageGallery from "./GuideImageGallery.vue";

const guides = currentRecipeSources.map((source) => ({
  source,
  imageUrl: getRecipeSourceImageUrl(source),
}));
const guideCreators = guides.map(({ source }) => source.creator).join("、");
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
      <p>菜谱资料参考了 {{ guideCreators }} 的菜谱图鉴，以及用户提供的游戏截图与文字资料。</p>
      <div class="source-links">
        <a href="https://space.bilibili.com/203145268" target="_blank" rel="noopener noreferrer">
          小铭同学的 B 站主页<RecipeIcon name="external" />
        </a>
      </div>
      <GuideImageGallery :guides="guides" />
    </section>
    <section aria-labelledby="image-sources-heading">
      <h2 id="image-sources-heading">菜品图片来源</h2>
      <p>菜品配图来自 Petit Planet Wiki 和 TapTap 作者「{{ taptapAuthors }}」的菜谱图鉴。</p>
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
        感谢 {{ guideCreators }}制作菜谱图鉴，用户补充游戏截图，Petit Planet Wiki
        社区整理菜品图标，以及 TapTap 作者「{{ taptapAuthors }}」分享攻略与配图。
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
</style>
