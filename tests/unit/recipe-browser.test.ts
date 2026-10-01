import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import { previousRecipeDataset } from "../../shared/recipes/history";
import { currentRecipes } from "../../shared/recipes/current";
import { getEffectEvidence } from "../../shared/recipes/effects";
import {
  defaultSearch,
  effectSummary,
  searchRecipes,
  searchFromQuery,
  searchToQuery,
  hasUncertainRecipe,
} from "../../app/utils/recipes";

const recipes = recipeDataset.recipes;
const byId = (id: string) => {
  const recipe = recipes.find((item) => item.id === `mt-20260924-${id}`);
  if (!recipe) throw new Error(`Missing fixture: ${id}`);
  return recipe;
};

describe("速查搜索与显示语义", () => {
  it("烹饪方式可完整或部分搜索，并与食材、词条和菜名组合", () => {
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "榨汁机 饮 奶" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["绵绵麦奶", "禾夏米麦奶", "漫香果麦奶"]);
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "烤 蒜香 奶" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["蒜香流心奶面包"]);
    const soup = byId("simple-003");
    const samples = [
      soup,
      {
        ...soup,
        cookingMethod: {
          status: "tentative" as const,
          raw: "煮锅？",
          candidate: "煮锅" as const,
          reason: "待确认",
        },
      },
    ];
    expect(searchRecipes(samples, { ...defaultSearch, query: "煮锅" })).toEqual([soup]);
    expect(searchRecipes(recipes, { ...defaultSearch, query: "榨汁机 烤箱" })).toEqual([]);
  });

  it("候选食材可被查找，但仍有待确认状态；不推断类别成员", () => {
    const result = searchRecipes(recipes, { ...defaultSearch, query: "茄子" });
    expect(result.map((recipe) => recipe.id)).toEqual(["mt-20260924-signature-004"]);
    expect(hasUncertainRecipe(result[0]!)).toBe(true);
    expect(result[0]!.ingredients[0]!.selection.status).toBe("tentative");
    expect(searchRecipes([byId("signature-033")], { ...defaultSearch, query: "虾类" })).toEqual([]);
  });

  it.each(["energy-asc", "energy-desc"] as const)("%s 把未知值排在末尾，且不修改原数据", (sort) => {
    // 新图力气已全部写明；用真实旧版未知值继续验证排序的降级行为。
    const samples = [
      ...recipes,
      ...previousRecipeDataset.recipes.filter((recipe) => recipe.energy.status === "unknown"),
    ];
    const originalOrder = samples.map((recipe) => recipe.id);
    const result = searchRecipes(samples, { ...defaultSearch, sort });
    expect(result.slice(-2).map((recipe) => recipe.id)).toEqual([
      "mt-20260923-free-005",
      "mt-20260923-free-006",
    ]);
    expect(samples.map((recipe) => recipe.id)).toEqual(originalOrder);
    expect(result[0]!.energy).toMatchObject({ value: sort === "energy-asc" ? 30 : 180 });
  });

  it("查询参数可以往返，非法枚举回退，保留未匹配的食材形成空结果", () => {
    const filters = {
      ...defaultSearch,
      query: "龙虾 贝类",
      sort: "energy-desc" as const,
    };
    expect(searchFromQuery(searchToQuery(filters))).toEqual(filters);
    expect(
      searchFromQuery({ q: ["小麦", "海鲜"], region: "__proto__", method: "炒锅", sort: "bad" }),
    ).toEqual({ ...defaultSearch, query: "小麦" });
    const missingIngredient = searchFromQuery({ ingredient: "不存在的食材" });
    expect(searchRecipes(recipes, missingIngredient)).toEqual([]);
  });

  it("多个关键词同时匹配，候选仍可命中且原始数据不被修改", () => {
    const before = structuredClone(recipes);
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "小麦 奶" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["禾夏米麦奶", "漫香果麦奶", "草莓奶蛋糕", "蒜香流心奶面包", "梦幻草莓奶蛋糕"]);
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "茄子 辣椒" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["茄茄擂辣饭"]);
    expect(recipes).toEqual(before);
  });

  it("旧食材参数转为可见搜索词，编辑或清空后不会重新生效", () => {
    expect(searchFromQuery({ ingredient: "小麦" }).query).toBe("小麦");
    const filters = searchFromQuery({ q: "小麦", ingredient: ["小麦", null, " ", "奶", "小麦"] });
    expect(filters.query).toBe("小麦 奶");
    expect(searchFromQuery(searchToQuery(filters))).toEqual(filters);
    const oldQuery = { ingredient: ["小麦", "奶"], region: "signature" };
    expect(
      searchFromQuery({ ...oldQuery, ...searchToQuery({ ...filters, query: "蘑菇" }) }).query,
    ).toBe("蘑菇");
    expect(searchFromQuery({ ...oldQuery, ...searchToQuery(defaultSearch) })).toEqual(
      defaultSearch,
    );
    expect(searchRecipes(recipes, searchFromQuery({ ingredient: ["小麦", "未收录"] }))).toEqual([]);
  });

  it("词条按完整名称交集匹配，不把荤素菜当作素菜或把待确认词条当作已知", () => {
    const soup = byId("simple-003");
    const samples = [
      soup,
      byId("simple-007"),
      byId("simple-020"),
      byId("simple-009"),
      { ...soup, tags: { status: "not-stated" as const, raw: "" as const } },
      {
        ...soup,
        tags: {
          status: "tentative" as const,
          raw: "素菜？/汤羹",
          candidate: soup.tags.status === "recorded" ? soup.tags.value : [],
          reason: "尚未确认的词条",
        },
      },
    ];
    const before = structuredClone(samples);
    expect(
      searchRecipes(samples, { ...defaultSearch, query: "素菜 汤羹" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["菌菇汤", "四时蔬果汤"]);
    expect(searchRecipes(samples, defaultSearch)).toHaveLength(samples.length);
    expect(samples).toEqual(before);
  });

  it("搜索关键词可分别命中菜名、食材和完整词条，多个词仍需同时匹配", () => {
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "草莓 小麦 甜点" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["草莓奶蛋糕", "梦幻草莓奶蛋糕"]);
    expect(
      searchRecipes(recipes, { ...defaultSearch, query: "荤素菜 海鲜 主食" }).map(
        (recipe) => recipe.name.raw,
      ),
    ).toEqual(["海鲜粥", "海鲜大铺面", "美味海风披萨"]);
    expect(searchRecipes(recipes, { ...defaultSearch, query: "甜点 汤羹" })).toEqual([]);
  });

  it("部分词可以命中词条，完整词条不会误匹配名称包含它的其他词条", () => {
    const samples = recipes.filter((recipe) =>
      ["和煦花果茶", "珍蔬麦饮", "菌菇汤", "菌菇鲜鱼羹"].includes(recipe.name.raw),
    );
    const namesFor = (query: string) =>
      searchRecipes(samples, { ...defaultSearch, query }).map((recipe) => recipe.name.raw);
    expect(namesFor("饮")).toEqual(["和煦花果茶", "珍蔬麦饮"]);
    expect(namesFor("品")).toEqual(["和煦花果茶", "珍蔬麦饮"]);
    expect(namesFor("饮 鲜花")).toEqual(["和煦花果茶"]);
    expect(namesFor("素")).toEqual(["菌菇汤", "菌菇鲜鱼羹"]);
    expect(namesFor("素菜")).toEqual(["菌菇汤"]);
  });

  it("停用的模式、分区、方式、词条和食材筛选参数不影响搜索，写回时清理", () => {
    const staleQuery = {
      mode: "filter",
      region: "simple",
      method: "榨汁机",
      tag: ["饮品", "甜点"],
      ingredients: ["未收录", "海鲜"],
      q: "煮锅",
      sort: "energy-desc",
    };
    const search = searchFromQuery(staleQuery);
    expect(search).toEqual({ query: "煮锅", sort: "energy-desc" });
    const samples = recipes.filter((recipe) =>
      ["菌菇汤", "绵绵麦奶", "茄茄擂辣饭"].includes(recipe.name.raw),
    );
    expect(searchRecipes(samples, search).map((recipe) => recipe.name.raw)).toEqual([
      "茄茄擂辣饭",
      "菌菇汤",
    ]);
    const cleared = { ...search, query: "" };
    expect(searchRecipes(samples, cleared)).toHaveLength(3);
    expect(searchFromQuery({ ...staleQuery, q: undefined, sort: undefined })).toEqual(
      defaultSearch,
    );
    const updatedQuery = { ...staleQuery, ...searchToQuery(cleared) };
    for (const key of [
      "mode",
      "region",
      "method",
      "tag",
      "ingredients",
      "ingredient",
      "q",
    ] as const) {
      expect(updatedQuery[key]).toBeUndefined();
    }
    expect(searchFromQuery(updatedQuery)).toEqual(cleared);
  });

  it("空白查询返回全部且不改变输入的分隔空格", () => {
    for (const query of ["", "   ", "　", "\u00a0"]) {
      const search = searchFromQuery({ q: query });
      expect(search.query).toBe(query);
      expect(searchRecipes(recipes, search)).toEqual(recipes);
    }
    expect(searchFromQuery({ q: "饮 " }).query).toBe("饮 ");
  });

  it("区分斜杠、空白、特殊效果和概率产出", () => {
    expect(effectSummary(byId("simple-001"))).toEqual({ label: "无特殊效果", note: "" });
    const oldBlank = previousRecipeDataset.recipes.find(
      (recipe) => recipe.id === "mt-20260923-free-005",
    )!;
    expect(effectSummary(oldBlank)).toEqual({ label: "未说明", note: "" });
    expect(effectSummary(byId("free-005"))).toEqual({ label: "概率产出", note: "产出概率未注明" });
    expect(effectSummary(byId("free-002"))).toEqual({ label: "概率产出", note: "产出概率未注明" });
    expect(effectSummary(byId("signature-033"))).toEqual({
      label: "轻盈潜行 · 三阶",
      note: "可能获得增益，概率未注明",
    });
    const current = currentRecipes.find((recipe) => recipe.id === byId("simple-001").id)!;
    const supplement = getEffectEvidence(current);
    expect(effectSummary(current, supplement)).toEqual({ label: "无特殊效果", note: "" });
    expect(current.specialEffect).toMatchObject({ status: "not-stated", raw: "" });
    expect(
      effectSummary(currentRecipes.find((recipe) => recipe.name.raw === "轰炸大菇肉")!),
    ).toEqual({ label: "未说明", note: "" });
    expect(
      effectSummary(
        {
          ...current,
          specialEffect: { status: "unknown", raw: "?", reason: "效果待确认" },
        },
        supplement,
      ),
    ).toEqual({ label: "未知", note: "" });
    expect(
      effectSummary({
        ...current,
        specialEffect: { status: "none", raw: "无", reason: "明确无效果" },
      }),
    ).toEqual({ label: "无特殊效果", note: "" });
    const free = currentRecipes.find((recipe) => recipe.id === byId("free-005").id)!;
    expect(effectSummary(free, getEffectEvidence(free))).toEqual({
      label: "概率产出",
      note: "产出概率未注明",
    });
  });
});
