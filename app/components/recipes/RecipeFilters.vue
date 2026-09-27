<script setup lang="ts">
import { cookingMethods, regionLabels } from "../../utils/recipes";
import type { CookingMethod, ImageRegion, RecipeFilters } from "../../utils/recipes";
import RecipeIcon from "./RecipeIcon.vue";

defineProps<{
  disabled: boolean;
  filters: RecipeFilters;
  ingredients: string[];
  regionCounts: Record<string, number>;
  total: number;
  activeCount: number;
}>();
const emit = defineEmits<{ change: [patch: Partial<RecipeFilters>]; reset: [] }>();
const methodIcons: Record<CookingMethod, "pot" | "glass" | "oven"> = {
  煮锅: "pot",
  榨汁机: "glass",
  烤箱: "oven",
};
const regions = Object.entries(regionLabels) as [ImageRegion, string][];
</script>

<template>
  <div class="recipe-filters">
    <div class="filters-title">
      <h2>筛选菜谱</h2>
      <button v-if="activeCount" type="button" class="reset-button" @click="emit('reset')">
        重置
      </button>
    </div>
    <fieldset class="filter-group" :disabled="disabled">
      <legend>图片分区</legend>
      <div class="region-options">
        <button
          type="button"
          class="region-option"
          :class="{ selected: filters.region === 'all' }"
          :aria-pressed="filters.region === 'all'"
          @click="emit('change', { region: 'all' })"
        >
          <span>全部菜谱</span><span class="region-count">{{ total }}</span>
        </button>
        <button
          v-for="[region, label] in regions"
          :key="region"
          type="button"
          class="region-option"
          :class="{ selected: filters.region === region }"
          :aria-pressed="filters.region === region"
          @click="emit('change', { region })"
        >
          <span>{{ label }}</span
          ><span class="region-count">{{ regionCounts[region] }}</span>
        </button>
      </div>
    </fieldset>
    <fieldset class="filter-group" :disabled="disabled">
      <legend>烹饪方式</legend>
      <div class="method-options">
        <button
          type="button"
          class="method-option"
          :class="{ selected: filters.method === 'all' }"
          :aria-pressed="filters.method === 'all'"
          @click="emit('change', { method: 'all' })"
        >
          全部方式
        </button>
        <button
          v-for="method in cookingMethods"
          :key="method"
          type="button"
          class="method-option"
          :class="{ selected: filters.method === method }"
          :aria-pressed="filters.method === method"
          @click="emit('change', { method })"
        >
          <RecipeIcon :name="methodIcons[method]" />{{ method }}
        </button>
      </div>
    </fieldset>
    <div class="filter-group ingredient-filter">
      <label for="ingredient-filter">食材</label>
      <select
        id="ingredient-filter"
        class="recipe-select"
        :disabled="disabled"
        :value="filters.ingredient"
        @change="emit('change', { ingredient: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">全部食材</option>
        <option
          v-if="filters.ingredient && !ingredients.includes(filters.ingredient)"
          :value="filters.ingredient"
        >
          {{ filters.ingredient }}（图片无此食材）
        </option>
        <option v-for="ingredient in ingredients" :key="ingredient" :value="ingredient">
          {{ ingredient }}
        </option>
      </select>
      <p class="filter-hint">按图片词项筛选，包含待确认候选。</p>
    </div>
  </div>
</template>

<style scoped>
.filters-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}
.filters-title h2 {
  font-size: 0.95rem;
  font-weight: 750;
}
.reset-button {
  font-size: 0.76rem;
  color: var(--petit-color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.filter-group {
  margin-bottom: 1.8rem;
}
.filter-group legend,
.ingredient-filter label {
  display: block;
  margin-bottom: 0.75rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.73rem;
  letter-spacing: 0.06em;
}
.region-options {
  display: grid;
  gap: 0.3rem;
}
.region-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 42px;
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 0.45rem;
  font-size: 0.84rem;
  transition: background 0.15s ease;
}
.region-option:hover {
  background: var(--petit-color-surface-hover);
}
.region-option.selected {
  background: var(--petit-color-primary);
  color: var(--petit-color-on-primary);
  font-weight: 750;
}
.region-count {
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.method-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}
.method-option {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  min-height: 42px;
  padding: 0.55rem 0.3rem;
  font-size: 0.76rem;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 40%, transparent);
  border-radius: 0.45rem;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.method-option svg {
  width: 16px;
  height: 16px;
}
.method-option:hover {
  background: var(--petit-color-surface-hover);
}
.method-option.selected {
  background: var(--petit-color-surface-active);
  border-color: var(--petit-color-border-strong);
  font-weight: 750;
}
.recipe-select {
  width: 100%;
  min-height: 44px;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 50%, transparent);
  border-radius: 0.45rem;
  background: transparent;
  padding: 0.65rem 0.5rem;
  font-size: 0.8rem;
}
.filter-hint {
  margin-top: 0.65rem;
  font-size: 0.7rem;
  line-height: 1.7;
  color: var(--petit-color-foreground-muted);
}
@media (max-width: 900px) {
  .recipe-filters {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 1rem 1.5rem;
  }
  .filters-title {
    display: none;
  }
  .filter-group {
    margin: 0;
    min-width: 0;
  }
  .filter-group:first-of-type {
    grid-column: 1 / -1;
  }
  .region-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .region-option {
    width: auto;
    gap: 0.8rem;
    padding: 0.55rem 0.75rem;
  }
  .method-options {
    display: flex;
    flex-wrap: wrap;
  }
  .method-option {
    padding: 0.6rem 0.7rem;
  }
  .filter-hint {
    font-size: 0.67rem;
  }
}
@media (max-width: 540px) {
  .recipe-filters {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .ingredient-filter {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 1rem;
  }
  .ingredient-filter label {
    margin-bottom: 0;
  }
  .filter-hint {
    grid-column: 2;
    margin-top: 0.4rem;
  }
  .region-options {
    gap: 0.35rem;
  }
  .region-option {
    padding: 0.55rem 0.65rem;
    font-size: 0.78rem;
  }
  .method-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .method-option {
    padding: 0.6rem 0.2rem;
  }
}
</style>
