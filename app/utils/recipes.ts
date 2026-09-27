import type { Recipe } from "../../shared/recipes/schema";

export type ImageRegion = Recipe["source"]["region"];
export type CookingMethod = Extract<Recipe["cookingMethod"], { status: "recorded" }>["value"];
export type RecipeSort = "source" | "energy-desc" | "energy-asc";
export interface RecipeFilters {
  query: string;
  region: ImageRegion | "all";
  method: CookingMethod | "all";
  ingredient: string;
  sort: RecipeSort;
}

export const regionLabels: Record<ImageRegion, string> = {
  simple: "简单菜",
  signature: "招牌菜",
  guest: "宴客菜",
  free: "自由烹饪",
  neighbor: "友邻秘方",
};
export const cookingMethods: CookingMethod[] = ["煮锅", "榨汁机", "烤箱"];
export const defaultFilters: RecipeFilters = {
  query: "",
  region: "all",
  method: "all",
  ingredient: "",
  sort: "source",
};

type QueryValues = Record<string, string | null | (string | null)[] | undefined>;
function first(value: QueryValues[string]) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function filtersFromQuery(query: QueryValues): RecipeFilters {
  const region = first(query.region);
  const method = first(query.method);
  const sort = first(query.sort);
  return {
    query: first(query.q),
    region: Object.hasOwn(regionLabels, region) ? (region as ImageRegion) : "all",
    method: cookingMethods.includes(method as CookingMethod) ? (method as CookingMethod) : "all",
    ingredient: first(query.ingredient),
    sort: sort === "energy-desc" || sort === "energy-asc" ? sort : "source",
  };
}

export function filtersToQuery(filters: RecipeFilters) {
  return {
    q: filters.query || undefined,
    region: filters.region === "all" ? undefined : filters.region,
    method: filters.method === "all" ? undefined : filters.method,
    ingredient: filters.ingredient || undefined,
    sort: filters.sort === "source" ? undefined : filters.sort,
  };
}

export function ingredientNames(recipe: Recipe): string[] {
  return recipe.ingredients.flatMap(({ selection }) => {
    const value =
      selection.status === "recorded"
        ? selection.value
        : selection.status === "tentative"
          ? selection.candidate
          : null;
    if (!value) return [];
    return value.kind === "any-of" ? value.options.map((option) => option.name) : [value.name];
  });
}

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().trim();
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  const terms = normalize(filters.query).split(/\s+/u).filter(Boolean);
  const filtered = recipes.filter((recipe) => {
    if (filters.region !== "all" && recipe.source.region !== filters.region) return false;
    if (
      filters.method !== "all" &&
      (recipe.cookingMethod.status !== "recorded" || recipe.cookingMethod.value !== filters.method)
    )
      return false;
    if (filters.ingredient && !ingredientNames(recipe).includes(filters.ingredient)) return false;
    const searchable = normalize(
      [recipe.name.raw, ...recipe.ingredients.map((slot) => slot.selection.raw)].join(" "),
    );
    return terms.every((term) => searchable.includes(term));
  });
  if (filters.sort === "source") return filtered;
  return filtered.sort((left, right) => {
    // 未知值始终排在末尾，不能以 0 参加任一方向的排序。
    if (left.energy.status !== "recorded") return right.energy.status === "recorded" ? 1 : 0;
    if (right.energy.status !== "recorded") return -1;
    const difference = left.energy.value - right.energy.value;
    return filters.sort === "energy-asc" ? difference : -difference;
  });
}

export function hasUncertainRecipe(recipe: Recipe) {
  return (
    recipe.name.status !== "recorded" ||
    recipe.energy.status !== "recorded" ||
    recipe.ingredients.some((slot) => slot.selection.status !== "recorded")
  );
}

export function effectSummary(recipe: Recipe) {
  if (recipe.productionChance.status === "unspecified-probability") {
    return { label: "概率产出", note: "产出概率未注明" };
  }
  const effect = recipe.specialEffect;
  if (effect.status === "recorded") {
    return {
      label: `${effect.value.name} · ${["", "一阶", "二阶", "三阶"][effect.value.tier]}`,
      note: "触发概率未注明",
    };
  }
  if (effect.status === "none") return { label: "明确无效果", note: effect.raw };
  if (effect.status === "unresolved")
    return { label: effect.raw || "待核对", note: "原文含义待核对" };
  if (effect.status === "tentative") return { label: effect.raw, note: "待确认" };
  return { label: effect.status === "unknown" ? "未知" : "未说明", note: "" };
}
