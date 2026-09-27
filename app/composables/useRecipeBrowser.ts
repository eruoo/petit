import { computed, onMounted, shallowRef } from "vue";
import { useRoute, useRouter } from "#imports";
import { recipeDataset } from "#shared/recipes/index";
import { defaultFilters, filterRecipes, filtersFromQuery, filtersToQuery } from "../utils/recipes";
import type { RecipeFilters } from "../utils/recipes";

export function useRecipeBrowser() {
  const route = useRoute();
  const router = useRouter();
  const hydrated = shallowRef(false);
  // SSG 首次水合与静态 HTML 保持一致，挂载后再读取当前 URL 的筛选条件。
  onMounted(() => {
    hydrated.value = true;
  });
  const filters = computed(() => filtersFromQuery(hydrated.value ? route.query : {}));
  const recipes = computed(() => filterRecipes(recipeDataset.recipes, filters.value));
  const regionCounts = Object.fromEntries(
    recipeDataset.inventory.regions.map((region) => [region.id, region.expectedRows]),
  );
  const activeFilterCount = computed(
    () =>
      Number(Boolean(filters.value.query)) +
      Number(filters.value.region !== "all") +
      Number(filters.value.method !== "all"),
  );

  let pendingFilters: RecipeFilters | undefined;
  function updateFilters(patch: Partial<RecipeFilters>) {
    // 连续操作可能早于上一次 URL 更新完成，须合并尚未落到路由的筛选请求。
    const nextFilters = {
      ...(pendingFilters ?? filtersFromQuery(router.currentRoute.value.query)),
      ...patch,
    };
    pendingFilters = nextFilters;
    return router
      .replace({
        query: { ...router.currentRoute.value.query, ...filtersToQuery(nextFilters) },
      })
      .finally(() => {
        if (pendingFilters === nextFilters) pendingFilters = undefined;
      });
  }
  function resetFilters() {
    return updateFilters(defaultFilters);
  }
  return {
    ready: hydrated,
    filters,
    recipes,
    regionCounts,
    activeFilterCount,
    updateFilters,
    resetFilters,
  };
}
