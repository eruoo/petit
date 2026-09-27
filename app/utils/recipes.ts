import { recipeTagSchema } from "#shared/recipes/schema";
import type { Recipe } from "../../shared/recipes/schema";

export type ImageRegion = Recipe["source"]["region"];
export type RecipeSort = "source" | "energy-desc" | "energy-asc";
export type RecipeView = "grid" | "list";
export interface RecipeSearch {
  query: string;
  sort: RecipeSort;
}

export const regionLabels: Record<ImageRegion, string> = {
  simple: "简单菜",
  signature: "招牌菜",
  guest: "宴客菜",
  free: "自由烹饪",
  neighbor: "秘制菜",
};
const recipeTags = recipeTagSchema.options;
export const defaultSearch: RecipeSearch = { query: "", sort: "source" };

type QueryValues = Record<string, string | null | (string | null)[] | undefined>;
function first(value: QueryValues[string]) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
function legacyIngredientTerms(value: QueryValues[string]): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => (item ?? "").split(/\s+/u)).filter(Boolean);
}

export function searchFromQuery(query: QueryValues): RecipeSearch {
  const sort = first(query.sort);
  const search = first(query.q);
  const legacyTerms = legacyIngredientTerms(query.ingredient);
  return {
    // 已有旧食材链接仍转成可见搜索词，不引入隐藏筛选。
    query: legacyTerms.length
      ? [...new Set([...search.split(/\s+/u).filter(Boolean), ...legacyTerms])].join(" ")
      : search,
    sort: sort === "energy-desc" || sort === "energy-asc" ? sort : "source",
  };
}

export function searchToQuery(search: RecipeSearch) {
  return {
    q: search.query || undefined,
    sort: search.sort === "source" ? undefined : search.sort,
    // 编辑搜索或排序时移除已停用的参数，其他无关查询参数交给路由保留。
    mode: undefined,
    region: undefined,
    method: undefined,
    tag: undefined,
    ingredients: undefined,
    ingredient: undefined,
  };
}

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().trim();
}

export function searchRecipes(recipes: Recipe[], search: RecipeSearch): Recipe[] {
  const terms = normalize(search.query).split(/\s+/u).filter(Boolean);
  const exactTagTerms = new Set(
    terms.filter((term) => recipeTags.some((tag) => normalize(tag) === term)),
  );
  const filtered = recipes.filter((recipe) => {
    const tags = recipe.tags;
    const searchable = normalize(
      [
        recipe.name.raw,
        ...recipe.ingredients.map((slot) => slot.selection.raw),
        recipe.cookingMethod.status === "recorded" ? recipe.cookingMethod.value : "",
      ].join(" "),
    );
    const searchableTags = tags.status === "recorded" ? tags.value.map(normalize) : [];
    // 部分词可查词条；完整词条仍精确匹配，避免“素菜”误命中“荤素菜”。
    return terms.every(
      (term) =>
        searchable.includes(term) ||
        searchableTags.some((tag) => (exactTagTerms.has(term) ? tag === term : tag.includes(term))),
    );
  });
  if (search.sort === "source") return filtered;
  return filtered.sort((left, right) => {
    // 未知值始终排在末尾，不能以 0 参加任一方向的排序。
    if (left.energy.status !== "recorded") return right.energy.status === "recorded" ? 1 : 0;
    if (right.energy.status !== "recorded") return -1;
    const difference = left.energy.value - right.energy.value;
    return search.sort === "energy-asc" ? difference : -difference;
  });
}

export function hasUncertainRecipe(recipe: Recipe) {
  return (
    recipe.name.status !== "recorded" ||
    recipe.energy.status !== "recorded" ||
    recipe.ingredients.some((slot) => slot.selection.status !== "recorded")
  );
}

export function effectSummary(
  recipe: Recipe,
  evidence?: { limit?: { unit: "uses" | "seconds"; value: number } },
) {
  if (recipe.productionChance.status === "unspecified-probability") {
    return {
      label: "概率产出",
      note: "产出概率未注明",
    };
  }
  const effect = recipe.specialEffect;
  if (effect.status === "recorded") {
    return {
      label: `${effect.value.name} · ${["", "一阶", "二阶", "三阶"][effect.value.tier]}`,
      note: evidence?.limit
        ? `${evidence.limit.value}${evidence.limit.unit === "uses" ? " 次内有效" : " 秒"} · 可能获得增益`
        : "可能获得增益，概率未注明",
    };
  }
  // 延续无效果料理的展示文案；原始空白或斜杠状态仍保留，不改为已确认 none。
  if (
    effect.status === "none" ||
    (recipe.source.region !== "free" &&
      (effect.status === "not-stated" || (effect.status === "unresolved" && effect.raw === "/")))
  )
    return { label: "无特殊效果", note: "" };
  if (effect.status === "unresolved")
    return { label: effect.raw || "待核对", note: "原文含义待核对" };
  if (effect.status === "tentative") return { label: effect.raw, note: "待确认" };
  return { label: effect.status === "unknown" ? "未知" : "未说明", note: "" };
}
