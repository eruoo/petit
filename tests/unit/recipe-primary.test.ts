import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import {
  primaryRecipeDataset,
  supplementalRecipeDataset,
  supplementalRecipesById,
  previousXiaomingRecipeDataset,
} from "../../shared/recipes/primary";
import {
  currentRecipes,
  currentRecipeSources,
  currentRecipeFieldSourcesById,
  currentRecipeQualitiesById,
  resolveCurrentRecipe,
  currentSourceRow,
  getRecipeDifferences,
} from "../../shared/recipes/current";
import { recipeDatasetSchema, recipeSchema } from "../../shared/recipes/schema";
import {
  gameEffectEvidence,
  effectEvidenceSchema,
  verifyEffectEvidenceReferences,
  getEffectEvidence,
  collectCurrentEvidenceConflicts,
  effectLimitSchema,
} from "../../shared/recipes/effects";
import { verifySourceAssets } from "../../scripts/check-recipes";

import { recipeDecisions, recipeDecisionsSchema } from "../../shared/recipes/decisions";

const recipe = (name: string) => currentRecipes.find((entry) => entry.name.raw === name)!;

describe("小铭 9/30 主体与历史资料的读取边界", () => {
  it("独立覆盖 102 行，保留已有 99 道的 ID，空配方菜不漏录", () => {
    expect(primaryRecipeDataset.inventory.regions.map((region) => region.expectedRows)).toEqual([
      37, 33, 14, 9, 9,
    ]);
    expect(currentRecipes).toHaveLength(102);
    expect(new Set(currentRecipes.map((entry) => entry.id)).size).toBe(102);
    const ids = new Set(currentRecipes.map((entry) => entry.id));
    expect(previousXiaomingRecipeDataset.recipes.every((entry) => ids.has(entry.id))).toBe(true);
    expect(recipeDataset.recipes.every((entry) => ids.has(entry.id))).toBe(true);
    expect(currentRecipes.filter((entry) => entry.id.startsWith("xm-0930-"))).toHaveLength(3);
    for (const dataset of [
      primaryRecipeDataset,
      supplementalRecipeDataset,
      previousXiaomingRecipeDataset,
    ]) {
      const missing = structuredClone(dataset);
      missing.recipes.pop();
      expect(recipeDatasetSchema.safeParse(missing).success).toBe(false);
    }
    for (const entry of currentRecipes)
      expect(currentSourceRow(entry)?.nameRaw).toBe(entry.name.raw);
    expect(() => verifySourceAssets(recipeDataset.sources)).not.toThrow();
  });

  it("最新配方优先，旧图只补词条和产出信息，原始转录不变", () => {
    expect(currentRecipeSources.map((source) => source.id)).toEqual([
      "xiaoming-0930-image",
      "tomorrow-20260924-image",
    ]);
    const before = JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset]);
    for (const primary of primaryRecipeDataset.recipes) {
      const current = resolveCurrentRecipe(primary);
      const { tags, productionChance, ingredients, ...core } = current;
      expect(core).toEqual(
        (({ tags: _tags, productionChance: _production, ingredients: _ingredients, ...rest }) =>
          rest)(primary),
      );
      if (primary.name.raw !== "外婆菜饭") expect(ingredients).toEqual(primary.ingredients);
      const supplemental = supplementalRecipesById.get(primary.id);
      expect(tags).toEqual(supplemental?.tags ?? primary.tags);
      expect(productionChance).toEqual(supplemental?.productionChance ?? primary.productionChance);
    }
    expect(JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset])).toBe(before);
    const cake = recipe("梦幻草莓奶蛋糕");
    expect(cake.tags.raw).toBe("甜点");
    expect(currentRecipeFieldSourcesById.get(cake.id)).toMatchObject({
      recipe: { sourceId: "xiaoming-0930-image", region: "guest", row: 12 },
      tags: { sourceId: "tomorrow-20260924-image" },
      guideDetails: { sourceId: "xiaoming-0930-image" },
    });
    expect(recipe("甜饼果茶").tags.status).toBe("not-stated");
  });

  it("外婆菜饭只移除已授权问号，原图仍保留问号与金色需求", () => {
    const current = recipe("外婆菜饭");
    const original = primaryRecipeDataset.recipes.find((entry) => entry.id === current.id)!;
    expect(original.ingredients[3]!.selection).toMatchObject({ status: "tentative", raw: "谷物?" });
    expect(current.ingredients[3]!.selection).toEqual({
      status: "recorded",
      raw: "谷物",
      value: { kind: "category", name: "谷物" },
    });
    expect(current.ingredients[3]!.quality).toEqual(original.ingredients[3]!.quality);
    expect(current.ingredients[3]!.quality).toMatchObject({ color: "gold" });
    expect(currentRecipeFieldSourcesById.get(current.id)?.ingredients).toEqual({
      source: original.source,
      userDecision: { id: "user-recipe-decisions-20261001", recipeId: current.id },
    });
    expect(recipeDecisions.gameVerified).toBe(false);
    expect(current.verification).toBe("image-transcribed-game-unverified");
    expect(recipe("梦幻金玉满堂饭").ingredients[3]!.selection).toMatchObject({
      status: "tentative",
      raw: "谷物?",
    });
  });

  it("新版去除的符号、蓝莓配方和厨具／阶级修订生效，其他问号不扩大确认", () => {
    for (const [name, index, raw] of [
      ["田园蔬荟披萨", 2, "黄瓜"],
      ["梦幻锦绣香蔬宴", 1, "蔬菜"],
      ["梦幻海岸虾鱼筵", 0, "虾类"],
      ["多果流彩捞饭", 3, "谷物"],
      ["梦幻星莓漫游派", 3, "蓝莓"],
    ] as const)
      expect(recipe(name).ingredients[index]!.selection).toMatchObject({ status: "recorded", raw });
    expect(recipe("漫香果麦奶").ingredients[0]!.selection.status).toBe("tentative");
    expect(recipe("梦幻三仙过海鱼").ingredients[2]!.selection.status).toBe("tentative");
    expect(recipe("梦幻番茄汤汁面").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "蔬菜?",
      "小麦",
      "奶",
      "番茄?",
    ]);
    expect(recipe("梦幻什锦饮?").name.status).toBe("tentative");
    expect(recipe("珍稀什锦砂锅").energy).toMatchObject({ value: 45 });
    expect(recipe("花香蜜瓜派").cookingMethod.raw).toBe("煮锅");
    expect(recipe("时蔬烧烤派对").specialEffect.raw).toBe("快速翻土 三阶");
    expect(getRecipeDifferences(recipe("梦幻星莓漫游派").id)).toContainEqual(
      expect.objectContaining({ field: "ingredients", current: "鱼类 + 小麦 + 贝类 + 蓝莓" }),
    );
  });

  it("新版食材顺序、重复槽位、合并格及品质需求一起采用", () => {
    const cake = recipe("梦幻草莓奶蛋糕");
    expect(cake.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "奶",
      "奶",
      "小麦",
      "草莓",
    ]);
    expect(cake.ingredients[3]!.quality).toMatchObject({
      color: "gold",
      interpretationId: "xiaoming-0930-ingredient-background",
    });
    expect(recipe("珍蔬麦饮").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "小麦",
      "蔬菜",
      "小麦",
    ]);
    const lobster = recipe("梦幻奇迹蒜龙虾");
    expect(lobster.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "龙虾",
      "蔬菜",
      "大蒜",
      "贝类",
    ]);
    expect(lobster.guideDetails?.groupedIngredients).toEqual([{ raw: "蔬菜+大蒜", slots: [1, 2] }]);
    const broken = structuredClone(lobster);
    broken.guideDetails!.groupedIngredients[0]!.slots = [1, 1];
    expect(recipeSchema.safeParse(broken).success).toBe(false);
    const shrimp = recipe("水果烤虾拼盘");
    expect(shrimp.ingredients.map((slot) => slot.quality.status)).toEqual([
      "not-stated",
      "interpreted",
      "not-stated",
    ]);
    expect(shrimp.guideDetails?.levelRaw).toBe("七级");
    expect(currentRecipeQualitiesById.get(shrimp.id)).toMatchObject({
      color: "gold",
      source: { guideId: "xiaoming-0930-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("谷物粥").id)).toMatchObject({
      color: "blue",
      source: { guideId: "tomorrow-20260924-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("甜饼果茶").id)?.status).toBe("unknown");
  });

  it("新增秘制菜保留图中原文，只有菜名的行不猜配方或力气", () => {
    const stew = recipe("卡拉红汁炖肉");
    expect(stew.energy).toMatchObject({ status: "recorded", value: 90 });
    expect(stew.specialEffect.raw).toBe("快速翻土 二阶");
    expect(recipe("百果甜甜圈").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "小麦",
      "鱼类",
    ]);
    const incomplete = recipe("轰炸大菇肉");
    expect(incomplete.ingredients).toEqual([]);
    expect(incomplete.cookingMethod.status).toBe("not-stated");
    expect(incomplete.energy).toEqual({ status: "not-stated", raw: "" });
    expect(incomplete.specialEffect.status).toBe("not-stated");
    expect(
      recipeSchema.safeParse({ ...incomplete, energy: { ...incomplete.energy, value: 0 } }).success,
    ).toBe(false);
  });

  it("用户决定拒绝重复、错槽和错原文，不能将别的食材提升为确定值", () => {
    const duplicate = structuredClone(recipeDecisions);
    duplicate.decisions.push(duplicate.decisions[0]!);
    expect(recipeDecisionsSchema.safeParse(duplicate).success).toBe(false);
    for (const patch of [
      { recipeId: "missing-id" },
      { slot: -1 },
      { slot: 90 },
      { previousRaw: "错误原文" },
      { raw: "虾类" },
    ]) {
      const broken = structuredClone(recipeDecisions);
      Object.assign(broken.decisions[0]!, patch);
      expect(recipeDecisionsSchema.safeParse(broken).success).toBe(false);
    }
    expect(
      recipeDecisionsSchema.safeParse({ ...recipeDecisions, gameVerified: true }).success,
    ).toBe(false);
  });
});

describe("独立游戏增益证据", () => {
  it("按当前效果名称和阶级关联，不沿用旧阶级或仅在雪菜图中的时长", () => {
    expect(gameEffectEvidence.screenshots).toHaveLength(12);
    expect(gameEffectEvidence.confirmations).toHaveLength(2);
    expect(() => verifySourceAssets(gameEffectEvidence.screenshots)).not.toThrow();
    expect(getEffectEvidence(recipe("谷物粥"))?.limit).toEqual({ unit: "uses", value: 6 });
    expect(getEffectEvidence(recipe("时蔬烧烤派对"))?.limit).toEqual({
      unit: "seconds",
      value: 100,
    });
    expect(getEffectEvidence(recipe("梦幻草莓奶蛋糕"))?.limit).toBeUndefined();
    expect(getEffectEvidence(recipe("梦幻奇迹蒜龙虾"))?.limit).toBeUndefined();
    expect(getEffectEvidence(recipe("果香鱼壶"))?.limit).toEqual({ unit: "seconds", value: 25 });
    expect(getEffectEvidence(recipe("梦幻鱼鲜寿司"))?.limit).toEqual({
      unit: "seconds",
      value: 60,
    });
    expect(
      gameEffectEvidence.screenshots.find((shot) => shot.nameRaw === "梦幻鱼鲜寿司")?.limit.status,
    ).toBe("obscured");
    expect(recipe("珍稀什锦饮").specialEffect.status).toBe("not-stated");
    expect(getEffectEvidence(recipe("珍稀什锦饮"))).toBeUndefined();
  });

  it("同菜截图支持播撒与播洒的证据关联，保留主体效果原文", () => {
    const dish = recipe("茄茄擂辣饭");
    expect(dish.specialEffect.raw).toBe("大力播洒 一阶");
    const evidence = getEffectEvidence(dish);
    expect(evidence?.limit).toEqual({ unit: "seconds", value: 10 });
    expect(
      evidence?.screenshots.some(
        (shot) => shot.recipeId === dish.id && shot.effectName === "大力播洒",
      ),
    ).toBe(true);
    expect(getEffectEvidence(recipe("三色果米糕"))?.limit).toEqual({ unit: "seconds", value: 20 });
  });

  it("证据冲突不静默挑选有效量，失效引用、重复 ID、错误单位会被拒绝", () => {
    expect(collectCurrentEvidenceConflicts(currentRecipes)).toEqual([]);
    const conflict = structuredClone(gameEffectEvidence);
    conflict.confirmations.push({
      ...conflict.confirmations[0]!,
      id: "conflicting-limit",
      effectName: "大力敲伐",
      tier: 1,
      recipeId: recipe("谷物粥").id,
      limit: { unit: "uses", value: 7 },
    });
    expect(getEffectEvidence(recipe("谷物粥"), conflict)).toMatchObject({ limitConflict: true });
    expect(getEffectEvidence(recipe("谷物粥"), conflict)?.limit).toBeUndefined();
    expect(collectCurrentEvidenceConflicts(currentRecipes, conflict)).toContainEqual(
      expect.stringContaining("谷物粥"),
    );
    const broken = structuredClone(gameEffectEvidence);
    broken.screenshots[0]!.recipeId = "missing-id";
    expect(() => verifyEffectEvidenceReferences(broken, currentRecipes)).toThrow(/引用不存在/u);
    broken.screenshots.push(broken.screenshots[0]!);
    expect(effectEvidenceSchema.safeParse(broken).success).toBe(false);
    const wrongUnit = structuredClone(gameEffectEvidence);
    wrongUnit.confirmations[0]!.limit.unit = "uses";
    expect(effectEvidenceSchema.safeParse(wrongUnit).success).toBe(false);
    expect(effectLimitSchema.safeParse({ unit: "seconds", value: 0 }).success).toBe(false);
    expect(effectLimitSchema.safeParse({ unit: "seconds", value: -1 }).success).toBe(false);
    expect(effectLimitSchema.safeParse({ unit: "percent", value: 100 }).success).toBe(false);
  });
});
