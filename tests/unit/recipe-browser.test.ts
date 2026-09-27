import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import { previousRecipeDataset } from "../../shared/recipes/history";
import {
  defaultFilters,
  effectSummary,
  filterRecipes,
  filtersFromQuery,
  filtersToQuery,
  hasUncertainRecipe,
  ingredientNames,
} from "../../app/utils/recipes";

const recipes = recipeDataset.recipes;
const byId = (id: string) => {
  const recipe = recipes.find((item) => item.id === `mt-20260924-${id}`);
  if (!recipe) throw new Error(`Missing fixture: ${id}`);
  return recipe;
};

describe("速查筛选与显示语义", () => {
  it("组合查询、分区、方式与食材，保留原图顺序", () => {
    const result = filterRecipes(recipes, {
      ...defaultFilters,
      query: "  小麦  ",
      region: "simple",
      method: "煮锅",
      ingredient: "小麦",
    });
    expect(result.map((recipe) => recipe.name.raw)).toEqual([
      "暖暖阳汤面",
      "乡蔬小麦面",
      "沁凉水果面",
      "海鲜大铺面",
    ]);
    expect(
      filterRecipes(recipes, { ...defaultFilters, query: "小麦 海鲜" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["海鲜大铺面", "美味海风披萨"]);
  });

  it("候选食材可被查找，但仍有待确认状态；不推断类别成员", () => {
    const result = filterRecipes(recipes, { ...defaultFilters, ingredient: "茄子" });
    expect(result.map((recipe) => recipe.id)).toEqual(["mt-20260924-signature-004"]);
    expect(hasUncertainRecipe(result[0]!)).toBe(true);
    expect(result[0]!.ingredients[0]!.selection.status).toBe("tentative");
    expect(
      filterRecipes([byId("signature-033")], { ...defaultFilters, ingredient: "虾类" }),
    ).toEqual([]);
    expect(ingredientNames(byId("guest-014"))).toEqual(["番茄", "小麦", "大蒜"]);
  });

  it.each(["energy-asc", "energy-desc"] as const)("%s 把未知值排在末尾，且不修改原数据", (sort) => {
    // 新图力气已全部写明；用真实旧版未知值继续验证排序的降级行为。
    const samples = [
      ...recipes,
      ...previousRecipeDataset.recipes.filter((recipe) => recipe.energy.status === "unknown"),
    ];
    const originalOrder = samples.map((recipe) => recipe.id);
    const result = filterRecipes(samples, { ...defaultFilters, sort });
    expect(result.slice(-2).map((recipe) => recipe.id)).toEqual([
      "mt-20260923-free-005",
      "mt-20260923-free-006",
    ]);
    expect(samples.map((recipe) => recipe.id)).toEqual(originalOrder);
    expect(result[0]!.energy).toMatchObject({ value: sort === "energy-asc" ? 30 : 180 });
    expect(ingredientNames(byId("simple-008"))).toEqual(["小麦", "小麦"]);
  });

  it("查询参数可以往返，非法枚举回退，保留未匹配的食材形成空结果", () => {
    const filters = {
      ...defaultFilters,
      query: "龙虾",
      region: "signature" as const,
      method: "烤箱" as const,
      ingredient: "贝类",
      sort: "energy-desc" as const,
    };
    expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters);
    expect(
      filtersFromQuery({ q: ["小麦", "海鲜"], region: "__proto__", method: "炒锅", sort: "bad" }),
    ).toEqual({ ...defaultFilters, query: "小麦" });
    const missingIngredient = filtersFromQuery({ ingredient: "不存在的食材" });
    expect(filterRecipes(recipes, missingIngredient)).toEqual([]);
  });

  it("区分斜杠、空白、特殊效果和概率产出", () => {
    expect(effectSummary(byId("simple-001"))).toEqual({ label: "/", note: "原文含义待核对" });
    const oldBlank = previousRecipeDataset.recipes.find(
      (recipe) => recipe.id === "mt-20260923-free-005",
    )!;
    expect(effectSummary(oldBlank)).toEqual({ label: "未说明", note: "" });
    expect(effectSummary(byId("free-005"))).toEqual({ label: "概率产出", note: "产出概率未注明" });
    expect(effectSummary(byId("free-002"))).toEqual({ label: "概率产出", note: "产出概率未注明" });
    expect(effectSummary(byId("signature-033"))).toEqual({
      label: "轻盈潜行 · 三阶",
      note: "触发概率未注明",
    });
  });
});
