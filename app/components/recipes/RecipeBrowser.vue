<script setup lang="ts">
import { computed, nextTick, shallowRef } from "vue";
import type { Recipe } from "../../../shared/recipes/schema";
import { useRecipeBrowser } from "../../composables/useRecipeBrowser";
import type { RecipeSort, RecipeView } from "../../utils/recipes";
import RecipeSearch from "./RecipeSearch.vue";
import RecipeList from "./RecipeList.vue";
import RecipeDetails from "./RecipeDetails.vue";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeViewToggle from "./RecipeViewToggle.vue";

const { ready, search, recipes, hasSearchQuery, updateSearch, clearSearch } = useRecipeBrowser();
const searchQuery = computed({
  get: () => search.value.query,
  set: (query: string) => {
    void updateSearch({ query });
  },
});
const selectedRecipe = shallowRef<Recipe | null>(null);
const detailsOpen = shallowRef(false);
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
          <p class="page-description">按菜名、食材、词条与烹饪方式查找配方。</p>
        </div>
        <div class="heading-index" aria-hidden="true">
          <RecipeIcon name="book" /><span>RECIPE<br />INDEX</span>
        </div>
      </div>
      <div class="browser-layout">
        <RecipeSearch v-model="searchQuery" :disabled="!ready" />
        <section
          id="recipe-results"
          class="results"
          :aria-busy="!ready"
          aria-labelledby="results-heading"
          tabindex="-1"
        >
          <div class="results-toolbar">
            <h2 id="results-heading">
              <strong>{{ recipes.length }}</strong> 道菜谱<span
                v-if="hasSearchQuery"
                class="search-label"
              >
                搜索结果</span
              >
            </h2>
            <div class="results-actions">
              <RecipeViewToggle v-model="view" :disabled="!ready" />
              <label class="sort-label"
                ><span>排序</span
                ><select
                  aria-label="菜谱排序"
                  :disabled="!ready"
                  :value="search.sort"
                  @change="
                    updateSearch({
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
          <RecipeList
            :recipes="recipes"
            :view="view"
            :disabled="!ready"
            @select="openRecipe"
            @reset="clearSearch"
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
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
.results {
  min-width: 0;
  scroll-margin-top: 1.5rem;
}
.results-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: 0.6rem 0 0.9rem;
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
.search-label {
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
@media (max-width: 900px) {
  .app-main {
    padding: 2.3rem 24px 2.5rem;
  }
  .page-heading {
    margin-bottom: 2.5rem;
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
  .results-toolbar {
    margin-top: 0.2rem;
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
  .search-label {
    display: none;
  }
}
</style>
