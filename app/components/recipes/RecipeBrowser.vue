<script setup lang="ts">
import { computed, nextTick, shallowRef } from "vue";
import { recipeDataset } from "#shared/recipes/index";
import type { Recipe } from "../../../shared/recipes/schema";
import { useRecipeBrowser } from "../../composables/useRecipeBrowser";
import type { RecipeSort, RecipeView } from "../../utils/recipes";
import RecipeFilters from "./RecipeFilters.vue";
import RecipeList from "./RecipeList.vue";
import RecipeDetails from "./RecipeDetails.vue";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeViewToggle from "./RecipeViewToggle.vue";

const { ready, filters, recipes, regionCounts, activeFilterCount, updateFilters, resetFilters } =
  useRecipeBrowser();
const searchQuery = computed({
  get: () => filters.value.query,
  set: (query: string) => {
    void updateFilters({ query });
  },
});
const selectedRecipe = shallowRef<Recipe | null>(null);
const detailsOpen = shallowRef(false);
const filtersExpanded = shallowRef(false);
const view = shallowRef<RecipeView>("grid");
const detailTrigger = shallowRef<HTMLButtonElement | null>(null);
function openRecipe(recipe: Recipe, trigger: HTMLButtonElement) {
  detailTrigger.value = trigger;
  selectedRecipe.value = recipe;
  detailsOpen.value = true;
}
async function restoreFocus() {
  await nextTick();
  if (detailTrigger.value?.isConnected) detailTrigger.value.focus({ preventScroll: true });
}
</script>

<template>
  <div class="recipe-app">
    <main id="main-content" class="app-main" tabindex="-1">
      <div class="page-heading">
        <div>
          <p class="page-eyebrow">星布谷地 · 烹饪速查</p>
          <h1>菜谱速查</h1>
          <p class="page-description">按菜名、食材与烹饪方式查找配方。</p>
        </div>
        <div class="heading-index" aria-hidden="true">
          <RecipeIcon name="book" /><span>RECIPE<br />INDEX</span>
        </div>
      </div>
      <div class="browser-layout">
        <aside class="sidebar" aria-label="菜谱筛选">
          <button
            type="button"
            class="mobile-filters-toggle"
            :disabled="!ready"
            :aria-expanded="filtersExpanded"
            :aria-label="filtersExpanded ? '收起菜谱筛选' : '展开菜谱筛选'"
            aria-controls="recipe-filter-options"
            @click="filtersExpanded = !filtersExpanded"
          >
            <span
              >筛选菜谱<span v-if="activeFilterCount"> · {{ activeFilterCount }} 项</span></span
            >
            <span>{{ filtersExpanded ? "收起" : "展开" }}<RecipeIcon name="chevron" /></span>
          </button>
          <div
            id="recipe-filter-options"
            class="sidebar-content"
            :class="{ expanded: filtersExpanded }"
          >
            <RecipeFilters
              :disabled="!ready"
              :filters="filters"
              :region-counts="regionCounts"
              :total="recipeDataset.recipes.length"
              :active-count="activeFilterCount"
              @change="updateFilters"
              @reset="resetFilters"
            />
          </div>
        </aside>
        <section
          id="recipe-results"
          class="results"
          :aria-busy="!ready"
          aria-labelledby="results-heading"
          tabindex="-1"
        >
          <div class="search-field">
            <RecipeIcon name="search" /><label class="sr-only" for="recipe-search"
              >搜索菜名或食材</label
            ><input
              id="recipe-search"
              v-model="searchQuery"
              :disabled="!ready"
              type="search"
              autocomplete="off"
              placeholder="菜名或食材，空格分隔"
            /><button
              v-if="filters.query"
              type="button"
              class="icon-button clear-search"
              aria-label="清空搜索"
              @click="updateFilters({ query: '' })"
            >
              <RecipeIcon name="close" /></button
            ><span v-else class="search-hint" aria-hidden="true">菜名 / 食材</span>
          </div>
          <div class="results-toolbar">
            <h2 id="results-heading">
              <strong>{{ recipes.length }}</strong> 道菜谱<span
                v-if="activeFilterCount"
                class="filtered-label"
                >筛选结果</span
              >
            </h2>
            <div class="results-actions">
              <RecipeViewToggle v-model="view" :disabled="!ready" />
              <label class="sort-label"
                ><span>排序</span
                ><select
                  aria-label="菜谱排序"
                  :disabled="!ready"
                  :value="filters.sort"
                  @change="
                    updateFilters({
                      sort: ($event.target as HTMLSelectElement).value as RecipeSort,
                    })
                  "
                >
                  <option value="source">原图顺序</option>
                  <option value="energy-desc">力气由高到低</option>
                  <option value="energy-asc">力气由低到高</option>
                </select></label
              >
            </div>
          </div>
          <p class="sr-only" role="status" aria-live="polite">共找到 {{ recipes.length }} 道菜谱</p>
          <div v-if="activeFilterCount" class="active-filter-bar">
            <span>当前有 {{ activeFilterCount }} 项筛选</span
            ><button type="button" @click="resetFilters">
              清除全部<RecipeIcon name="close" />
            </button>
          </div>
          <RecipeList
            :recipes="recipes"
            :view="view"
            :disabled="!ready"
            @select="openRecipe"
            @reset="resetFilters"
          />
          <footer v-if="recipes.length" class="results-footer">
            <span>已显示全部 {{ recipes.length }} 道菜谱</span
            ><a href="#recipe-search">回到搜索 ↑</a>
          </footer>
        </section>
      </div>
    </main>
    <RecipeDetails
      v-model:open="detailsOpen"
      :recipe="selectedRecipe"
      @restore-focus="restoreFocus"
    />
  </div>
</template>

<style scoped>
.app-main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 3.2rem 48px 3rem;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3.4rem;
}
.page-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--petit-color-foreground-muted);
}
.page-heading h1 {
  font-size: clamp(1.8rem, 3vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  color: var(--petit-color-foreground-heading);
  margin-top: 0.7rem;
  line-height: 1.4;
}
.page-description {
  font-size: 0.85rem;
  color: var(--petit-color-foreground-muted);
  margin-top: 0.65rem;
}
.heading-index {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 0 1rem 1.5rem;
  border-left: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 23%, transparent);
  color: var(--petit-color-foreground-muted);
}
.heading-index svg {
  width: 34px;
  height: 34px;
  stroke-width: 1.1;
}
.heading-index span {
  font-size: 0.63rem;
  letter-spacing: 0.18em;
  line-height: 1.65;
}
.browser-layout {
  display: grid;
  grid-template-columns: 192px minmax(0, 1fr);
  gap: 3rem;
  align-items: start;
}
.sidebar {
  position: sticky;
  top: 1.5rem;
}
.mobile-filters-toggle {
  display: none;
}
.results {
  min-width: 0;
  scroll-margin-top: 1.5rem;
}
.search-field {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 54px;
  background: color-mix(in srgb, var(--petit-color-border) 50%, var(--petit-color-background));
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 55%, transparent);
  border-radius: 0.6rem;
  padding: 0 1rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.search-field:focus-within {
  border-color: var(--petit-color-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--petit-color-focus) 20%, transparent);
}
.search-field > svg {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  color: var(--petit-color-foreground-muted);
}
.search-field input {
  flex: 1;
  min-width: 0;
  padding: 0.9rem 0;
  background: transparent;
  font-size: 0.86rem;
  outline: none;
}
.search-field input::-webkit-search-cancel-button {
  display: none;
}
.search-field input::placeholder {
  color: var(--petit-color-foreground-muted);
  opacity: 0.95;
}
.search-hint {
  font-size: 0.65rem;
  color: var(--petit-color-foreground-muted);
  white-space: nowrap;
}
.clear-search {
  margin-right: -0.6rem;
}
.results-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 1.6rem 0 0.9rem;
}
.results-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.results-toolbar h2 {
  font-size: 0.83rem;
}
.results-toolbar h2 strong {
  font-size: 1.15rem;
  font-weight: 800;
  margin-right: 0.25rem;
  font-variant-numeric: tabular-nums;
}
.filtered-label {
  margin-left: 0.75rem;
  font-size: 0.7rem;
  color: var(--petit-color-foreground-muted);
}
.sort-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--petit-color-foreground-muted);
}
.sort-label select {
  min-height: 38px;
  padding: 0.4rem 0.3rem;
  background: transparent;
  color: var(--petit-color-foreground);
  cursor: pointer;
  font-size: 0.76rem;
}
.active-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.7rem;
  background: var(--petit-color-surface-hover);
  border-radius: 0.35rem;
  margin: 0 0 0.7rem;
  font-size: 0.7rem;
}
.active-filter-bar button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--petit-color-link);
}
.active-filter-bar button svg {
  width: 13px;
  height: 13px;
}
.results-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.8rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.72rem;
}
.results-footer a {
  color: var(--petit-color-link);
  text-decoration: underline;
  text-underline-offset: 4px;
}
@media (max-width: 1230px) {
  .browser-layout {
    gap: 2rem;
    grid-template-columns: 176px minmax(0, 1fr);
  }
}
@media (max-width: 900px) {
  .app-main {
    padding: 2.3rem 24px 2.5rem;
  }
  .page-heading {
    margin-bottom: 2.5rem;
  }
  .browser-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  .sidebar {
    position: static;
  }
  .mobile-filters-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
    font-size: 0.8rem;
    text-align: left;
  }
  .mobile-filters-toggle > span:last-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    color: var(--petit-color-foreground-muted);
  }
  .mobile-filters-toggle svg {
    width: 12px;
    height: 12px;
    transform: rotate(90deg);
    transition: transform 0.15s ease;
  }
  .mobile-filters-toggle[aria-expanded="true"] svg {
    transform: rotate(-90deg);
  }
  .sidebar-content {
    display: none;
  }
  .sidebar-content.expanded {
    display: block;
    padding: 1.4rem 0 0.6rem;
  }
}
@media (max-width: 600px) {
  .heading-index {
    display: none;
  }
  .app-main {
    padding-top: 1.9rem;
  }
  .page-heading h1 {
    font-size: 1.85rem;
  }
  .page-description {
    font-size: 0.78rem;
  }
  .page-heading {
    margin-bottom: 2rem;
  }
  .search-hint {
    display: none;
  }
  .search-field {
    padding: 0 0.75rem;
  }
  .search-field input {
    font-size: 16px;
  }
  .results-toolbar {
    margin-top: 1.2rem;
    gap: 0.6rem;
  }
  .results-actions {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .sort-label > span {
    display: none;
  }
  .filtered-label {
    display: none;
  }
}
</style>
