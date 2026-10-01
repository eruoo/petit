<script setup lang="ts">
import { computed } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import type { Recipe } from "../../../shared/recipes/schema";
import { currentRecipeSources, currentRecipeQualitiesById } from "#shared/recipes/current";
import { getEffectEvidence } from "#shared/recipes/effects";
import { effectSummary, regionLabels } from "../../utils/recipes";
import { getRecipeImage } from "../../utils/recipe-images";
import IngredientSlots from "./IngredientSlots.vue";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeImage from "./RecipeImage.vue";
import RecipeQualityBadge from "./RecipeQualityBadge.vue";
import RecipeEffectEvidence from "./RecipeEffectEvidence.vue";

const props = defineProps<{ recipe: Recipe | null; open: boolean }>();
const emit = defineEmits<{ "update:open": [open: boolean]; restoreFocus: [] }>();
const effect = computed(() =>
  props.recipe ? effectSummary(props.recipe, getEffectEvidence(props.recipe)) : null,
);
const dishImage = computed(() => (props.recipe ? getRecipeImage(props.recipe.id) : undefined));
const dishQuality = computed(() =>
  props.recipe ? currentRecipeQualitiesById.get(props.recipe.id) : undefined,
);
const recipeNotes = computed(() => {
  const source = currentRecipeSources.find((item) => item.id === props.recipe?.source.sourceId);
  return source?.notes.filter((note) => props.recipe?.noteIds.includes(note.id)) ?? [];
});
const accessNotes = computed(() =>
  // 原始玩家注释随采用的配方来源读取；自由烹饪说明在效果区展示。
  recipeNotes.value.filter(
    (note) => note.appliesTo.length === 1 && note.appliesTo.includes("neighbor"),
  ),
);
function restoreFocus(event: Event) {
  event.preventDefault();
  emit("restoreFocus");
}
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="recipe-overlay" />
      <DialogContent class="recipe-dialog" @close-auto-focus="restoreFocus">
        <template v-if="recipe">
          <div class="dialog-header">
            <RecipeImage
              class="detail-image"
              :image="dishImage"
              :name="recipe.name.raw"
              :quality="dishQuality"
              eager
            />
            <div class="dialog-heading">
              <span class="dialog-eyebrow">{{ regionLabels[recipe.source.region] }}</span>
              <DialogTitle class="dialog-title">{{ recipe.name.raw }}</DialogTitle>
              <RecipeQualityBadge :quality="dishQuality" />
              <DialogDescription class="sr-only">
                查看{{ recipe.name.raw }}的食材、烹饪方式和特殊效果。
              </DialogDescription>
            </div>
            <DialogClose class="icon-button dialog-close" aria-label="关闭配方详情"
              ><RecipeIcon name="close"
            /></DialogClose>
          </div>
          <div class="dialog-body">
            <div v-if="recipe.guideDetails?.acquisitionRaw" class="access-note">
              配方获取：{{ recipe.guideDetails.acquisitionRaw }}
            </div>
            <div v-for="note in accessNotes" :key="note.id" class="access-note">
              {{ note.raw }}
            </div>
            <section class="detail-section">
              <div class="section-title">
                <h3>所需食材</h3>
                <span v-if="recipe.ingredients.length"
                  >{{ recipe.ingredients.length }} 个食材槽位</span
                >
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
              <h3>
                {{
                  recipe.productionChance.status === "unspecified-probability"
                    ? "菜品产出"
                    : "特殊效果"
                }}
              </h3>
              <p class="effect-name">{{ effect?.label }}</p>
              <p v-if="effect?.note" class="detail-muted">{{ effect.note }}</p>
              <RecipeEffectEvidence :recipe="recipe" />
            </section>
          </div>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.recipe-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--petit-color-scrim);
}
.recipe-overlay[data-state="open"] {
  animation: overlay-in 0.18s ease-out;
}
.recipe-overlay[data-state="closed"] {
  animation: overlay-out 0.15s ease-in;
}
.recipe-dialog {
  --dialog-y: -50%;
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, var(--dialog-y));
  width: min(680px, calc(100vw - 40px));
  max-height: min(880px, calc(100svh - 64px));
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: var(--petit-color-background);
  box-shadow: 0 24px 90px rgb(37 42 40 / 22%);
  overflow: hidden;
}
.recipe-dialog[data-state="open"] {
  animation: dialog-in 0.2s ease-out;
}
.recipe-dialog[data-state="closed"] {
  animation: dialog-out 0.15s ease-in;
}
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.8rem 2rem 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 22%, transparent);
}
.detail-image {
  width: 112px;
  flex: 0 0 112px;
  align-self: center;
}
.dialog-heading {
  flex: 1;
  min-width: 0;
}
.dialog-eyebrow {
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  letter-spacing: 0.07em;
}
.dialog-title {
  margin-top: 0.55rem;
  font-size: clamp(1.3rem, 4vw, 1.7rem);
  font-weight: 800;
  color: var(--petit-color-foreground-heading);
  letter-spacing: -0.035em;
  line-height: 1.45;
}
.dialog-close {
  flex-shrink: 0;
  margin: -0.25rem -0.5rem 0 0;
}
.dialog-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.5rem 2rem 2rem;
}
.detail-section {
  margin-bottom: 1.8rem;
}
.detail-section h3 {
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
@keyframes overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translate(-50%, var(--dialog-y)) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, var(--dialog-y)) scale(1);
  }
}
@keyframes dialog-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translate(-50%, var(--dialog-y)) scale(0.98);
  }
}
@media (max-width: 600px) {
  .recipe-dialog {
    --dialog-y: 0%;
    top: auto;
    bottom: 0;
    width: 100%;
    max-height: 92svh;
    border-radius: 18px 18px 0 0;
  }
  .dialog-header {
    padding: 1.4rem 1.25rem 1.2rem;
    gap: 0.8rem;
  }
  .detail-image {
    width: 76px;
    flex-basis: 76px;
  }
  .dialog-body {
    padding: 1.35rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
  }
}
</style>
