<script setup lang="ts">
import { recipeCategoryOptions } from "../../utils/recipes";
import type { RecipeCategory } from "../../utils/recipes";

const category = defineModel<RecipeCategory>({ required: true });
defineProps<{ disabled: boolean }>();
</script>

<template>
  <fieldset class="category-filter" :disabled="disabled">
    <legend class="sr-only">菜谱分类</legend>
    <label v-for="option in recipeCategoryOptions" :key="option.value" class="category-option">
      <input
        v-model="category"
        class="sr-only category-input"
        type="radio"
        name="recipe-category"
        :value="option.value"
      />
      <span class="category-label">{{ option.label }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.category-filter {
  display: grid;
  grid-template-columns: repeat(7, auto);
  justify-content: start;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  gap: 0.5rem;
}
.category-option {
  position: relative;
  min-width: 0;
}
.category-label {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  border-radius: 0.6rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.category-option:hover .category-label {
  background: var(--petit-color-surface-hover);
}
.category-input:checked + .category-label {
  border-color: var(--petit-color-primary);
  background: var(--petit-color-primary);
  color: var(--petit-color-on-primary);
}
.category-input:focus-visible + .category-label {
  outline: 2px solid var(--petit-color-foreground);
  outline-offset: 3px;
}
.category-filter:disabled .category-label {
  cursor: wait;
  opacity: 0.65;
}
@media (max-width: 600px) {
  .category-filter {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .category-label {
    padding-inline: 0.5rem;
  }
}
</style>
