<script setup lang="ts">
import { computed } from "vue";
import { currentRecipes, currentRecipeQualitiesById } from "#shared/recipes/current";
import { siteMetadata } from "#shared/site";
import { effectSummary, regionLabels } from "../../utils/recipes";
import { getRecipeImage } from "../../utils/recipe-images";
import RecipeDetailContent from "../../components/recipes/RecipeDetailContent.vue";
import RecipeImage from "../../components/recipes/RecipeImage.vue";
import RecipeQualityBadge from "../../components/recipes/RecipeQualityBadge.vue";

definePageMeta({
  validate: (route) => currentRecipes.some((recipe) => recipe.id === route.params.id),
});

const route = useRoute();
const recipe = computed(() => currentRecipes.find((item) => item.id === route.params.id));

useSiteSeo(() => {
  const dish = recipe.value;
  if (!dish) return siteMetadata;
  const ingredients = dish.ingredients.map((slot) => slot.selection.raw || "未说明").join(" + ");
  const details = [
    `烹饪方式：${dish.cookingMethod.raw || "未说明"}`,
    `增加力气：${dish.energy.status === "recorded" ? `+${dish.energy.value}` : "未知"}`,
  ];
  if (dish.ingredients.some((slot) => slot.quality.status === "interpreted")) {
    details.push("含食材品质要求");
  }
  const effect = effectSummary(dish);
  const effectText =
    dish.productionChance.status === "unspecified-probability" || effect.label === "无特殊效果"
      ? effect.label
      : `特殊效果：${effect.label}`;
  details.push(effect.note ? `${effectText}（${effect.note}）` : effectText);
  return {
    title: `${dish.name.raw}配方 · 星布谷地 · Petit`,
    description: `《星布谷地》${dish.name.raw}配方：${ingredients || "食材未说明"}。${details.join("；")}。`,
  };
});
</script>

<template>
  <main v-if="recipe" id="main-content" class="recipe-page" tabindex="-1">
    <NuxtLink to="/" class="back-to-recipes">← 返回菜谱速查</NuxtLink>
    <header class="recipe-page-header">
      <RecipeImage
        class="recipe-page-image"
        :image="getRecipeImage(recipe.id)"
        :name="recipe.name.raw"
        :quality="currentRecipeQualitiesById.get(recipe.id)"
        eager
      />
      <div class="recipe-page-heading">
        <p class="recipe-category">星布谷地 · {{ regionLabels[recipe.source.region] }}</p>
        <h1>{{ recipe.name.raw }}</h1>
        <RecipeQualityBadge :quality="currentRecipeQualitiesById.get(recipe.id)" />
      </div>
    </header>
    <RecipeDetailContent :recipe="recipe" />
  </main>
</template>

<style scoped>
.recipe-page {
  width: min(760px, calc(100% - 96px));
  margin: 0 auto;
  padding: 2.5rem 0 3rem;
}
.back-to-recipes {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--petit-color-link);
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.recipe-page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 1rem 0 1.8rem;
  padding-bottom: 1.8rem;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 22%, transparent);
}
.recipe-page-image {
  width: 112px;
  flex: 0 0 112px;
}
.recipe-page-heading {
  min-width: 0;
}
.recipe-category {
  color: var(--petit-color-foreground-muted);
  font-size: 0.75rem;
}
.recipe-page-heading h1 {
  margin: 0.5rem 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 800;
  line-height: 1.45;
  color: var(--petit-color-foreground-heading);
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .recipe-page {
    width: calc(100% - 48px);
    padding-top: 1.5rem;
  }
  .recipe-page-header {
    gap: 1rem;
  }
  .recipe-page-image {
    width: 76px;
    flex-basis: 76px;
  }
}
</style>
