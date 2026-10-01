<script setup lang="ts">
import { computed } from "vue";
import type { Recipe } from "../../../shared/recipes/schema";
import { currentRecipeSources } from "#shared/recipes/current";
import { getEffectEvidence } from "#shared/recipes/effects";
import { effectSummary } from "../../utils/recipes";
import IngredientSlots from "./IngredientSlots.vue";
import RecipeEffectEvidence from "./RecipeEffectEvidence.vue";

const props = withDefaults(defineProps<{ recipe: Recipe; headingTag?: "h2" | "h3" }>(), {
  headingTag: "h2",
});
const effect = computed(() => effectSummary(props.recipe, getEffectEvidence(props.recipe)));
const accessNotes = computed(() => {
  const source = currentRecipeSources.find((item) => item.id === props.recipe.source.sourceId);
  // 只展示这道菜关联的友邻说明；自由烹饪说明由效果区维护。
  return (
    source?.notes.filter(
      (note) =>
        props.recipe.noteIds.includes(note.id) &&
        note.appliesTo.length === 1 &&
        note.appliesTo.includes("neighbor"),
    ) ?? []
  );
});
</script>

<template>
  <div class="recipe-detail-content">
    <div v-if="recipe.guideDetails?.acquisitionRaw" class="access-note">
      配方获取：{{ recipe.guideDetails.acquisitionRaw }}
    </div>
    <div v-for="note in accessNotes" :key="note.id" class="access-note">
      {{ note.raw }}
    </div>
    <section class="detail-section">
      <div class="section-title">
        <component :is="headingTag" class="detail-heading">所需食材</component>
        <span v-if="recipe.ingredients.length">{{ recipe.ingredients.length }} 个食材槽位</span>
      </div>
      <IngredientSlots :recipe="recipe" expanded />
    </section>
    <dl class="recipe-facts">
      <div>
        <dt>烹饪方式</dt>
        <dd>{{ recipe.cookingMethod.raw || "未说明" }}</dd>
      </div>
      <div>
        <dt>增加力气</dt>
        <dd v-if="recipe.energy.status === 'recorded'" class="energy-value">
          +{{ recipe.energy.value }}
        </dd>
        <dd v-else class="pending-text">未知</dd>
      </div>
      <div class="fact-tags">
        <dt>词条</dt>
        <dd>{{ recipe.tags.raw || "未说明" }}</dd>
      </div>
    </dl>
    <section class="effect-detail detail-section">
      <component :is="headingTag" class="detail-heading">
        {{ recipe.productionChance.status === "unspecified-probability" ? "菜品产出" : "特殊效果" }}
      </component>
      <p class="effect-name">{{ effect?.label }}</p>
      <p v-if="effect?.note" class="detail-muted">{{ effect.note }}</p>
      <RecipeEffectEvidence :recipe="recipe" />
    </section>
  </div>
</template>

<style scoped>
.detail-section {
  margin-bottom: 1.8rem;
}
.detail-heading {
  font-size: 0.85rem;
  font-weight: 750;
}
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.section-title > span {
  font-size: 0.65rem;
  color: var(--petit-color-foreground-muted);
}
.recipe-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.9rem;
}
.recipe-facts dt {
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  margin-bottom: 0.5rem;
}
.recipe-facts dd {
  font-size: 0.95rem;
}
.recipe-facts .energy-value {
  font-weight: 800;
  font-size: 1.2rem;
  line-height: 1;
}
.fact-tags {
  grid-column: 1 / -1;
}
.pending-text {
  color: var(--petit-color-warning);
}
.effect-detail {
  padding: 1.2rem 1.3rem;
  background: var(--petit-color-surface-hover);
  border-radius: 0.65rem;
}
.effect-name {
  margin-top: 0.7rem;
  font-size: 1.05rem;
  font-weight: 700;
}
.detail-muted {
  font-size: 0.74rem;
  line-height: 1.9;
  color: var(--petit-color-foreground-muted);
  margin-top: 0.35rem;
}
.access-note {
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--petit-color-border-selected);
  background: var(--petit-color-surface-hover);
  font-size: 0.8rem;
  line-height: 1.8;
  margin-bottom: 1.6rem;
}
</style>
