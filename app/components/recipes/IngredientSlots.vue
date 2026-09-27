<script setup lang="ts">
import { computed } from "vue";
import type { IngredientQualityColor, Recipe } from "../../../shared/recipes/schema";
const props = defineProps<{ recipe: Recipe; expanded?: boolean }>();
const qualityLabels: Record<IngredientQualityColor, string> = {
  blue: "蓝色品质",
  purple: "紫色品质",
  gold: "金色品质",
};
const slots = computed(() =>
  props.recipe.ingredients.map(({ selection, quality }, index) => ({
    index,
    raw: selection.raw,
    text: selection.status === "unknown" ? "未知食材 ?" : selection.raw || "未说明",
    uncertain: selection.status !== "recorded",
    reason: "reason" in selection ? selection.reason : "",
    qualityColor: quality.status === "interpreted" ? quality.color : undefined,
    qualityLabel: quality.status === "interpreted" ? qualityLabels[quality.color] : undefined,
  })),
);
</script>

<template>
  <ol class="ingredient-slots" :class="{ expanded }" aria-label="有序食材">
    <li
      v-for="slot in slots"
      :key="slot.index"
      class="ingredient-slot"
      :class="{ uncertain: slot.uncertain }"
      :title="slot.reason"
    >
      <span v-if="expanded" class="slot-index">{{ String(slot.index + 1).padStart(2, "0") }}</span>
      <span class="ingredient-value" :data-quality="slot.qualityColor">
        <span class="ingredient-text">{{ slot.text }}</span>
        <span v-if="slot.qualityLabel" class="ingredient-quality-label"
          >需{{ slot.qualityLabel }}</span
        >
      </span>
      <span v-if="slot.uncertain" :class="expanded ? 'slot-status' : 'sr-only'">待确认</span>
    </li>
  </ol>
</template>

<style scoped>
.ingredient-slots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0;
  font-size: 0.84rem;
  line-height: 1.6;
}
.ingredient-slot {
  display: inline-flex;
  align-items: baseline;
}
.ingredient-value {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
}
.ingredient-value[data-quality] {
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
  color: var(--ingredient-quality-foreground);
  background: var(--ingredient-quality-background);
}
.ingredient-value[data-quality="blue"] {
  --ingredient-quality-background: #dceaf0;
  --ingredient-quality-foreground: #365f78;
}
.ingredient-value[data-quality="purple"] {
  --ingredient-quality-background: #e8dcf0;
  --ingredient-quality-foreground: #704985;
}
.ingredient-value[data-quality="gold"] {
  --ingredient-quality-background: #f5dfb8;
  --ingredient-quality-foreground: #805719;
}
.ingredient-quality-label {
  font-size: 0.68rem;
  white-space: nowrap;
}
.ingredient-slot + .ingredient-slot::before {
  content: "+";
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  margin: 0 0.4rem;
}
.uncertain .ingredient-text {
  color: var(--petit-color-warning);
  text-decoration: underline dotted;
  text-underline-offset: 4px;
}
.expanded {
  display: grid;
  gap: 0;
  font-size: 1rem;
}
.expanded .ingredient-slot {
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 16%, transparent);
}
.expanded .ingredient-slot::before {
  content: none;
}
.slot-index {
  color: var(--petit-color-foreground-muted);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.slot-status {
  margin-left: auto;
  color: var(--petit-color-warning);
  font-size: 0.73rem;
}
</style>
