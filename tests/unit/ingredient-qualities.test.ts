import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index.ts";
import { recipeDatasetSchema, ingredientSlotSchema } from "../../shared/recipes/schema.ts";
import type { RecipeDataset } from "../../shared/recipes/schema.ts";

function byName(name: string, dataset = recipeDataset) {
  const recipe = dataset.recipes.find((entry) => entry.name.raw === name);
  if (!recipe) throw new Error(`缺少样本：${name}`);
  return recipe;
}

describe("食材底色对应品质要求", () => {
  it("覆盖独立复核原图的 53 个有底色槽位，不为无底色的 197 项补猜品质", () => {
    // 从 9 月 24 日原图逐格清点，独立于 JSON 与 visualCues。
    const expected = {
      simple: { purple: 7, gold: 0 },
      signature: { purple: 19, gold: 4 },
      guest: { purple: 8, gold: 8 },
      free: { purple: 3, gold: 3 },
      neighbor: { purple: 1, gold: 0 },
    };
    const allSlots = recipeDataset.recipes.flatMap((recipe) => recipe.ingredients);
    expect(allSlots).toHaveLength(250);
    expect(allSlots.filter((slot) => slot.quality.status === "not-stated")).toHaveLength(197);
    for (const [region, counts] of Object.entries(expected)) {
      const qualities = recipeDataset.recipes
        .filter((recipe) => recipe.source.region === region)
        .flatMap((recipe) => recipe.ingredients.map((slot) => slot.quality));
      for (const [color, count] of Object.entries(counts)) {
        expect(
          qualities.filter(
            (quality) => quality.status === "interpreted" && quality.color === color,
          ),
        ).toHaveLength(count);
      }
    }
    const source = recipeDataset.sources.find(
      (entry) => entry.id === recipeDataset.inventory.sourceId,
    )!;
    expect(source.visualLegend.status).toBe("not-stated");
    expect(source.ingredientQualityInterpretation).toMatchObject({
      kind: "user-confirmation",
      statementRaw: "截图表格中所需食材，如果有背景底色的也代表对应需求的品质",
    });
  });

  it("品质属于具体槽位，重复虾类不合并，也不传播到相邻食材", () => {
    const shrimp = byName("水果烤虾拼盘");
    expect(shrimp.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "虾类",
      "虾类",
      "水果类",
    ]);
    expect(shrimp.ingredients[0]?.quality).toMatchObject({
      status: "interpreted",
      color: "purple",
    });
    expect(shrimp.ingredients[1]?.quality).toEqual({ status: "not-stated", raw: "" });
    expect(byName("美味海风披萨").ingredients.map((slot) => slot.quality.status)).toEqual([
      "not-stated",
      "not-stated",
      "interpreted",
    ]);
    expect(byName("梦幻奇迹蒜龙虾").ingredients).toHaveLength(4);
    expect(byName("梦幻奇迹蒜龙虾").ingredients[0]?.quality).toMatchObject({ color: "gold" });
    expect(byName("时蔬烧烤派对").ingredients.map((slot) => slot.quality)).toEqual(
      Array.from({ length: 4 }, () => ({
        status: "interpreted",
        color: "purple",
        interpretationId: "ingredient-background-user-20260926",
      })),
    );
  });

  it("品质解释不改变候选、未知与可选食材，文字颜色和加粗不推断品质", () => {
    const eggplant = byName("茄茄擂辣饭").ingredients[0]!;
    expect(eggplant.selection).toMatchObject({ status: "tentative", raw: "茄子?" });
    expect(eggplant.quality).toMatchObject({ status: "interpreted", color: "purple" });
    const unknown = byName("梦幻番茄汤汁面").ingredients[3]!;
    expect(unknown.selection).toMatchObject({ status: "unknown", raw: "?" });
    expect(unknown.quality.status).toBe("not-stated");
    const mixed = byName("珍稀什锦饮").ingredients[0]!;
    expect(mixed.selection).toMatchObject({ value: { kind: "any-of" } });
    expect(mixed.quality).toMatchObject({ color: "purple" });
    for (const name of ["暖暖阳汤面", "果蔬沙拉"]) {
      expect(byName(name).ingredients.every((slot) => slot.quality.status === "not-stated")).toBe(
        true,
      );
    }
  });

  const brokenReferences: [string, (dataset: RecipeDataset) => void][] = [
    [
      "品质与槽位底色不符",
      (data) => {
        const quality = byName("美味海风披萨", data).ingredients[2]!.quality;
        if (quality.status === "interpreted") quality.color = "gold";
      },
    ],
    [
      "用户解释引用缺失",
      (data) => {
        const quality = byName("美味海风披萨", data).ingredients[2]!.quality;
        if (quality.status === "interpreted") quality.interpretationId = "missing-interpretation";
      },
    ],
    [
      "删除原图底色依据",
      (data) => {
        const recipe = byName("美味海风披萨", data);
        recipe.visualCues = recipe.visualCues.filter((cue) => cue.field !== "ingredients.2");
      },
    ],
    [
      "仅凭加粗推断品质",
      (data) => {
        byName("暖暖阳汤面", data).ingredients[0]!.quality = {
          status: "interpreted",
          color: "blue",
          interpretationId: "ingredient-background-user-20260926",
        };
      },
    ],
    [
      "遗漏有底色的品质要求",
      (data) => {
        byName("美味海风披萨", data).ingredients[2]!.quality = { status: "not-stated", raw: "" };
      },
    ],
    [
      "将解释挂到另一图片来源",
      (data) => {
        const current = data.sources.find((entry) => entry.id === data.inventory.sourceId)!;
        data.sources[0]!.ingredientQualityInterpretation = current.ingredientQualityInterpretation;
        delete current.ingredientQualityInterpretation;
      },
    ],
  ];
  it.each(brokenReferences)("拒绝%s", (_label, mutate) => {
    const data = structuredClone(recipeDataset);
    mutate(data);
    expect(recipeDatasetSchema.safeParse(data).success).toBe(false);
  });

  it("拒绝未知品质颜色与附带虚构阶级", () => {
    const slot = byName("美味海风披萨").ingredients[2]!;
    for (const patch of [{ color: "red" }, { tier: 3 }]) {
      expect(
        ingredientSlotSchema.safeParse({ ...slot, quality: { ...slot.quality, ...patch } }).success,
      ).toBe(false);
    }
  });
});
