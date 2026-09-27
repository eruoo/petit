<script setup lang="ts">
import { computed } from "vue";
import type { Recipe } from "../../../shared/recipes/schema";
import { effectSummary, hasUncertainRecipe, regionLabels } from "../../utils/recipes";
import type { RecipeView } from "../../utils/recipes";
import { getRecipeImage } from "../../utils/recipe-images";
import { currentRecipeQualitiesById as recipeQualitiesById } from "#shared/recipes/current";
import { getEffectEvidence } from "#shared/recipes/effects";
import IngredientSlots from "./IngredientSlots.vue";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeImage from "./RecipeImage.vue";
import RecipeQualityBadge from "./RecipeQualityBadge.vue";
const props = defineProps<{
  recipes: Recipe[];
  disabled: boolean;
  view: RecipeView;
}>();
const emit = defineEmits<{ select: [recipe: Recipe, trigger: HTMLButtonElement]; reset: [] }>();
const rows = computed(() =>
  props.recipes.map((recipe) => ({
    recipe,
    image: getRecipeImage(recipe.id),
    quality: recipeQualitiesById.get(recipe.id),
    effect: effectSummary(recipe, getEffectEvidence(recipe)),
    uncertain: hasUncertainRecipe(recipe),
  })),
);
</script>

<template>
  <div v-if="rows.length" class="recipe-list" :data-view="view">
    <div v-if="view === 'list'" class="list-head recipe-columns" aria-hidden="true">
      <span>配图</span><span>菜名</span><span>食材</span><span>方式</span
      ><span class="energy-heading">力气</span><span class="effect-column">效果与产出</span><span />
    </div>
    <ul aria-label="菜谱结果">
      <li v-for="row in rows" :key="row.recipe.id">
        <button
          type="button"
          class="recipe-row recipe-columns"
          :disabled="disabled"
          :aria-label="`查看${row.recipe.name.raw}配方`"
          @click="emit('select', row.recipe, $event.currentTarget as HTMLButtonElement)"
        >
          <RecipeImage
            class="row-image"
            :image="row.image"
            :name="row.recipe.name.raw"
            :quality="row.quality"
          />
          <span class="recipe-title"
            ><span class="recipe-name">{{ row.recipe.name.raw }}</span
            ><span class="recipe-meta"
              ><span>{{ regionLabels[row.recipe.source.region] }}</span>
              <RecipeQualityBadge :quality="row.quality" />
              <span v-if="row.uncertain" class="uncertain-label">待确认</span></span
            ></span
          >
          <IngredientSlots v-if="view === 'list'" class="row-ingredients" :recipe="row.recipe" />
          <span class="row-method">{{ row.recipe.cookingMethod.raw }}</span>
          <span class="row-energy" :class="{ unknown: row.recipe.energy.status !== 'recorded' }"
            ><template v-if="row.recipe.energy.status === 'recorded'"
              ><span class="energy-plus">+</span>{{ row.recipe.energy.value }}</template
            ><template v-else>未知</template><span class="sr-only">力气</span></span
          >
          <span v-if="view === 'list'" class="row-effect effect-column"
            ><span>{{ row.effect.label }}</span
            ><span class="effect-note">{{ row.effect.note }}</span></span
          >
          <RecipeIcon v-if="view === 'list'" class="row-arrow" name="chevron" />
        </button>
      </li>
    </ul>
  </div>
  <div v-else class="empty-state" role="status">
    <RecipeIcon name="search" />
    <h3>没有找到匹配的菜谱</h3>
    <p>试试换个菜名、食材、词条或烹饪方式。</p>
    <button type="button" class="primary-button" @click="emit('reset')">清除搜索条件</button>
  </div>
</template>

<style scoped>
.recipe-columns {
  display: grid;
  grid-template-columns:
    64px minmax(150px, 1.1fr) minmax(170px, 1.35fr) 62px 60px minmax(155px, 1fr)
    14px;
  align-items: center;
  column-gap: 14px;
}
.list-head {
  min-height: 42px;
  padding: 0 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 40%, transparent);
  color: var(--petit-color-foreground-muted);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}
.energy-heading {
  text-align: right;
  padding-right: 5px;
}
.recipe-row {
  width: 100%;
  min-height: 93px;
  padding: 1.05rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 17%, transparent);
  transition: background 0.15s ease;
}
.recipe-row:hover {
  background: var(--petit-color-surface-hover);
}
.recipe-row:focus-visible {
  outline-offset: -2px;
}
.recipe-title {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}
.recipe-name {
  font-size: 0.93rem;
  line-height: 1.5;
  font-weight: 700;
  color: var(--petit-color-foreground-heading);
}
.recipe-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
  font-size: 0.68rem;
  color: var(--petit-color-foreground-muted);
}
.uncertain-label {
  color: var(--petit-color-warning);
}
.uncertain-label::before {
  content: "·";
  margin-right: 0.55rem;
}
.row-method {
  font-size: 0.75rem;
  color: var(--petit-color-foreground-muted);
}
.row-energy {
  font-size: 1.1rem;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  text-align: right;
  padding-right: 5px;
}
.energy-plus {
  font-weight: 500;
  margin-right: 0.12em;
}
.row-energy.unknown {
  font-size: 0.78rem;
  color: var(--petit-color-warning);
  font-weight: 400;
}
.row-effect {
  display: grid;
  gap: 0.3rem;
  font-size: 0.73rem;
  padding-left: 0.5rem;
}
.effect-note {
  color: var(--petit-color-foreground-muted);
  font-size: 0.66rem;
}
.row-arrow {
  width: 14px;
  height: 14px;
  color: var(--petit-color-foreground-muted);
  transition: transform 0.15s ease;
}
.recipe-row:hover .row-arrow {
  transform: translateX(3px);
}
.empty-state {
  text-align: center;
  padding: 5rem 1rem;
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 30%, transparent);
}
.empty-state > svg {
  width: 35px;
  height: 35px;
  margin: 0 auto 1.5rem;
  color: var(--petit-color-foreground-muted);
}
.empty-state h3 {
  font-size: 1.15rem;
  font-weight: 700;
}
.empty-state p {
  margin: 0.8rem 0 1.5rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.86rem;
}
@media (min-width: 901px) and (max-width: 1230px) {
  .recipe-columns {
    grid-template-columns: 56px minmax(0, 1fr) minmax(0, 1.2fr) 55px 55px 14px;
    gap: 10px;
  }
  .effect-column {
    display: none;
  }
}
@media (max-width: 900px) {
  .recipe-columns {
    grid-template-columns: 56px minmax(0, 1fr) minmax(0, 1.2fr) 55px 55px 14px;
    gap: 12px;
  }
  .effect-column {
    display: none;
  }
}
@media (max-width: 600px) {
  .list-head {
    display: none;
  }
  .recipe-list {
    border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 35%, transparent);
  }
  .recipe-columns {
    grid-template-columns: 56px minmax(0, 1fr) auto 12px;
    gap: 0.6rem 0.625rem;
  }
  .recipe-row {
    padding: 1.25rem 0.15rem;
  }
  .recipe-title {
    grid-column: 2;
    grid-row: 1;
  }
  .row-image {
    grid-column: 1;
    grid-row: 1 / 3;
    align-self: start;
  }
  .recipe-name {
    font-size: 1rem;
  }
  .row-energy {
    grid-column: 3;
    grid-row: 1;
    align-self: start;
  }
  .row-arrow {
    grid-column: 4;
    grid-row: 1;
    align-self: start;
    margin-top: 0.45rem;
  }
  .row-ingredients {
    grid-column: 2 / -1;
    grid-row: 2;
  }
  .row-method {
    grid-column: 2;
    grid-row: 3;
  }
}

.recipe-list[data-view="grid"] {
  border-top: 0;
}
.recipe-list[data-view="grid"] > ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
  gap: 0.7rem;
}
.recipe-list[data-view="grid"] .recipe-row {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto 1fr auto;
  align-items: start;
  gap: 0.75rem 0.3rem;
  height: 100%;
  min-height: 0;
  padding: 0.8rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 0.8rem;
}
.recipe-list[data-view="grid"] .recipe-row:hover {
  border-color: color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
}
.recipe-list[data-view="grid"] .row-image {
  grid-column: 1 / -1;
  grid-row: 1;
  justify-self: center;
  width: min(100%, 156px);
}
.recipe-list[data-view="grid"] .recipe-title {
  grid-column: 1 / -1;
  grid-row: 2;
  gap: 0.3rem;
  text-align: center;
}
.recipe-list[data-view="grid"] .recipe-name {
  font-size: 0.88rem;
  overflow-wrap: anywhere;
}
.recipe-list[data-view="grid"] .recipe-meta {
  justify-content: center;
  gap: 0.15rem 0.45rem;
}
.recipe-list[data-view="grid"] .uncertain-label::before {
  margin-right: 0.35rem;
}
.recipe-list[data-view="grid"] .row-method {
  grid-column: 1;
  grid-row: 3;
  align-self: center;
}
.recipe-list[data-view="grid"] .row-energy {
  grid-column: 2;
  grid-row: 3;
  font-size: 1rem;
  padding: 0;
}
@media (max-width: 600px) {
  .recipe-list[data-view="grid"] > ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .recipe-list[data-view="grid"] .recipe-row {
    padding: 0.65rem 0.4rem;
  }
}
</style>
