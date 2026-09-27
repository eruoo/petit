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
} from "../../app/utils/recipes";

const recipes = recipeDataset.recipes;
const byId = (id: string) => {
  const recipe = recipes.find((item) => item.id === `mt-20260924-${id}`);
  if (!recipe) throw new Error(`Missing fixture: ${id}`);
  return recipe;
};

describe("速查筛选与显示语义", () => {
  it("组合食材关键词、分区与方式，保留原图顺序", () => {
    const result = filterRecipes(recipes, {
      ...defaultFilters,
      query: "  小麦  ",
      region: "simple",
      method: "煮锅",
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
    const result = filterRecipes(recipes, { ...defaultFilters, query: "茄子" });
    expect(result.map((recipe) => recipe.id)).toEqual(["mt-20260924-signature-004"]);
    expect(hasUncertainRecipe(result[0]!)).toBe(true);
    expect(result[0]!.ingredients[0]!.selection.status).toBe("tentative");
    expect(filterRecipes([byId("signature-033")], { ...defaultFilters, query: "虾类" })).toEqual(
      [],
    );
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
  });

  it("查询参数可以往返，非法枚举回退，保留未匹配的食材形成空结果", () => {
    const filters = {
      ...defaultFilters,
      query: "龙虾 贝类",
      region: "signature" as const,
      method: "烤箱" as const,
      sort: "energy-desc" as const,
    };
    expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters);
    expect(
      filtersFromQuery({ q: ["小麦", "海鲜"], region: "__proto__", method: "炒锅", sort: "bad" }),
    ).toEqual({ ...defaultFilters, query: "小麦" });
    const missingIngredient = filtersFromQuery({ ingredient: "不存在的食材" });
    expect(filterRecipes(recipes, missingIngredient)).toEqual([]);
  });

  it("多个关键词同时匹配，候选仍可命中且原始数据不被修改", () => {
    const before = structuredClone(recipes);
    expect(
      filterRecipes(recipes, { ...defaultFilters, query: "小麦 奶" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["禾夏米麦奶", "漫香果麦奶", "草莓奶蛋糕", "蒜香流心奶面包", "梦幻草莓奶蛋糕"]);
    expect(
      filterRecipes(recipes, { ...defaultFilters, query: "茄子 辣椒" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["茄茄擂辣饭"]);
    expect(recipes).toEqual(before);
  });

  it("旧食材参数转为可见搜索词，编辑或清空后不会重新生效", () => {
    expect(filtersFromQuery({ ingredient: "小麦" }).query).toBe("小麦");
    const filters = filtersFromQuery({ q: "小麦", ingredient: ["小麦", null, " ", "奶", "小麦"] });
    expect(filters.query).toBe("小麦 奶");
    expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters);
    const oldQuery = { ingredient: ["小麦", "奶"], region: "signature" };
    expect(
      filtersFromQuery({ ...oldQuery, ...filtersToQuery({ ...filters, query: "蘑菇" }) }).query,
    ).toBe("蘑菇");
    expect(filtersFromQuery({ ...oldQuery, ...filtersToQuery(defaultFilters) })).toEqual(
      defaultFilters,
    );
    expect(filterRecipes(recipes, filtersFromQuery({ ingredient: ["小麦", "未收录"] }))).toEqual(
      [],
    );
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
