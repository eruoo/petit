import { computed, onMounted, shallowRef } from "vue";
import { useRoute, useRouter } from "#imports";
import { currentRecipes } from "#shared/recipes/current";
import { searchRecipes, searchFromQuery, searchToQuery } from "../utils/recipes";
import type { RecipeSearch } from "../utils/recipes";

export function useRecipeBrowser() {
  const route = useRoute();
  const router = useRouter();
  const hydrated = shallowRef(false);
  // SSG 首次水合与静态 HTML 保持一致，挂载后再读取当前 URL。
  onMounted(() => {
    hydrated.value = true;
  });
  const search = computed(() => searchFromQuery(hydrated.value ? route.query : {}));
  const recipes = computed(() => searchRecipes(currentRecipes, search.value));
  const hasSearchQuery = computed(() => Boolean(search.value.query.trim()));

  let pendingSearch: RecipeSearch | undefined;
  function updateSearch(patch: Partial<RecipeSearch>) {
    // 分类、连续输入或排序可能早于上一次 URL 更新完成，须合并尚未落到路由的请求。
    const nextSearch = {
      ...(pendingSearch ?? searchFromQuery(router.currentRoute.value.query)),
      ...patch,
    };
    pendingSearch = nextSearch;
    return router
      .replace({
        // 保留页内定位，避免 Nuxt 将移除锚点解释为返回页顶。
        hash: router.currentRoute.value.hash,
        query: { ...router.currentRoute.value.query, ...searchToQuery(nextSearch) },
      })
      .finally(() => {
        if (pendingSearch === nextSearch) pendingSearch = undefined;
      });
  }
  function resetSearch() {
    return updateSearch({ category: "all", query: "" });
  }
  return { ready: hydrated, search, recipes, hasSearchQuery, updateSearch, resetSearch };
}
