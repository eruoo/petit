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
import { currentRecipeQualitiesById } from "#shared/recipes/current";
import { regionLabels } from "../../utils/recipes";
import { getRecipeImage } from "../../utils/recipe-images";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeImage from "./RecipeImage.vue";
import RecipeQualityBadge from "./RecipeQualityBadge.vue";
import RecipeDetailContent from "./RecipeDetailContent.vue";

const props = defineProps<{ recipe: Recipe | null; open: boolean }>();
const emit = defineEmits<{ "update:open": [open: boolean]; restoreFocus: [] }>();
const dishImage = computed(() => (props.recipe ? getRecipeImage(props.recipe.id) : undefined));
const dishQuality = computed(() =>
  props.recipe ? currentRecipeQualitiesById.get(props.recipe.id) : undefined,
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
            <RecipeDetailContent :recipe="recipe" />
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
