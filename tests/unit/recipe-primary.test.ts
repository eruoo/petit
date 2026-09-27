import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import {
  primaryRecipeDataset,
  supplementalRecipeDataset,
  supplementalRecipesById,
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

describe("明天主体与小铭补充的读取边界", () => {
  it("独立校验明天 94 行和小铭 99 行，当前为 94 道主体加五道秘制菜", () => {
    expect(primaryRecipeDataset.inventory.regions.map((region) => region.expectedRows)).toEqual([
      37, 33, 14, 9, 1,
    ]);
    expect(
      supplementalRecipeDataset.inventory.regions.map((region) => region.expectedRows),
    ).toEqual([37, 33, 14, 9, 6]);
    expect(currentRecipes).toHaveLength(99);
    const ids = new Set(currentRecipes.map((entry) => entry.id));
    expect(ids.size).toBe(99);
    expect(recipeDataset.recipes.every((entry) => ids.has(entry.id))).toBe(true);
    expect(
      currentRecipes.filter((entry) => entry.id.startsWith("xm-")).map((entry) => entry.name.raw),
    ).toEqual(["独角仙米面包", "冬虫夏草煲", "卡拉红汁炖肉", "露营方便烤鱼", "甜饼果茶"]);
    for (const source of [primaryRecipeDataset, supplementalRecipeDataset]) {
      const missing = structuredClone(source);
      missing.recipes.pop();
      expect(recipeDatasetSchema.safeParse(missing).success).toBe(false);
    }
    for (const entry of currentRecipes) {
      expect(currentSourceRow(entry)?.nameRaw).toBe(entry.name.raw);
    }
  });

  it("采用视图只应用指定例外，补充字段可追溯，原始转录保持不变", () => {
    expect(currentRecipeSources.map((source) => source.id)).toEqual([
      "tomorrow-20260924-image",
      "xiaoming-0927-image",
    ]);
    expect(
      currentRecipes.filter((entry) => entry.source.sourceId === "tomorrow-20260924-image"),
    ).toHaveLength(94);
    const before = JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset]);
    for (const primary of primaryRecipeDataset.recipes) {
      const resolved = resolveCurrentRecipe(primary);
      const { guideDetails, ...core } = resolved;
      const changedIds = new Set([
        "mt-20260924-signature-004",
        "mt-20260924-signature-006",
        "mt-20260924-signature-024",
        "mt-20260924-signature-026",
        "mt-20260924-guest-012",
      ]);
      if (!changedIds.has(primary.id)) expect(core).toEqual(primary);
      else {
        expect(core).not.toEqual(primary);
        expect({
          ...core,
          ingredients: primary.ingredients,
          visualCues: primary.visualCues,
        }).toEqual(primary);
      }
      expect(guideDetails?.levelRaw).toBe(
        supplementalRecipesById.get(primary.id)?.guideDetails?.levelRaw,
      );
    }
    expect(JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset])).toBe(before);
    const bamboo = recipe("竹香苹果冰");
    expect(bamboo.guideDetails?.acquisitionRaw).toBe("云果");
    expect(currentRecipeFieldSourcesById.get(bamboo.id)).toMatchObject({
      recipe: { sourceId: "tomorrow-20260924-image", region: "neighbor", row: 1 },
      guideDetails: { sourceId: "xiaoming-0927-image", region: "neighbor", row: 1 },
    });
    const free = recipe("梦幻什锦饮");
    expect(free.tags).toMatchObject({ status: "recorded", raw: "饮品" });
    expect(free.productionChance.status).toBe("unspecified-probability");
    expect(currentRecipeFieldSourcesById.get(free.id)).toMatchObject({
      tags: { sourceId: "tomorrow-20260924-image", region: "free", row: 6 },
      productionChance: { sourceId: "tomorrow-20260924-image", region: "free", row: 6 },
    });
    expect(recipe("甜饼果茶").tags.status).toBe("not-stated");
  });

  it("未获用户更改的问号、未知和斜杠仍保留，指定冲突采用主体值", () => {
    expect(recipe("梦幻海岸虾鱼筵").ingredients[0]!.selection).toMatchObject({
      status: "tentative",
      raw: "虾类?",
      candidate: { name: "虾类" },
    });
    for (const name of [
      "漫香果麦奶",
      "梦幻锦绣香蔬宴",
      "多果流彩捞饭",
      "梦幻三仙过海鱼",
      "外婆菜饭",
      "梦幻金玉满堂饭",
      "梦幻星莓漫游派",
      "梦幻什锦饮",
      "梦幻番茄汤汁面",
      "梦幻海岸虾鱼筵",
    ]) {
      const current = recipe(name);
      expect(current.ingredients).toEqual(
        primaryRecipeDataset.recipes.find((entry) => entry.id === current.id)!.ingredients,
      );
    }
    expect(recipe("梦幻番茄汤汁面").ingredients[3]!.selection).toMatchObject({
      status: "unknown",
      raw: "?",
    });
    expect(recipe("梦幻什锦饮").name.status).toBe("recorded");
    const unknown = recipe("卡拉红汁炖肉");
    expect(unknown.energy).toMatchObject({ status: "unknown", raw: "没看到截图" });
    expect(unknown.energy).not.toHaveProperty("value");
    expect(unknown.specialEffect.status).toBe("unknown");
    expect(recipe("和煦花果茶").specialEffect).toMatchObject({ status: "unresolved", raw: "/" });
    expect(recipe("珍稀什锦砂锅").energy).toEqual({ status: "recorded", value: 70, raw: "70" });
    expect(recipe("时蔬烧烤派对").specialEffect.raw).toBe("快速翻土 二阶");
    expect(recipe("花香蜜瓜派").cookingMethod.raw).toBe("烤箱");
    expect(
      recipeSchema.safeParse({ ...unknown, energy: { ...unknown.energy, value: 0 } }).success,
    ).toBe(false);
  });

  it("重复食材保留，补充图的合并格不会错绑到主体食材顺序", () => {
    expect(recipe("梦幻草莓奶蛋糕").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "奶",
      "奶",
      "小麦",
      "草莓",
    ]);
    expect(recipe("珍蔬麦饮").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "小麦",
      "小麦",
      "蔬菜类",
    ]);
    expect(recipe("梦幻鱼鲜寿司").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "鱼类",
      "稻米",
      "稻米",
      "蔬菜类",
    ]);
    const lobster = recipe("梦幻奇迹蒜龙虾");
    expect(lobster.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "龙虾",
      "大蒜",
      "蔬菜类",
      "贝类",
    ]);
    expect(lobster.guideDetails?.groupedIngredients).toEqual([]);
    const supplemental = supplementalRecipesById.get(lobster.id)!;
    expect(supplemental.guideDetails?.groupedIngredients).toEqual([
      { raw: "蔬菜+大蒜", slots: [1, 2] },
    ]);
    const broken = structuredClone(supplemental);
    broken.guideDetails!.groupedIngredients[0]!.slots = [1, 1];
    expect(recipeSchema.safeParse(broken).success).toBe(false);
  });

  it("四处符号移除有用户确认，保留品质与原图问号，不冒充游戏验证", () => {
    for (const [name, slotIndex, ingredient] of [
      ["茄茄擂辣饭", 0, "茄子"],
      ["满满大烩菜", 1, "玉米"],
      ["草莓奶蛋糕", 0, "草莓"],
      ["田园蔬烩披萨", 2, "黄瓜"],
    ] as const) {
      const current = recipe(name);
      const original = primaryRecipeDataset.recipes.find((entry) => entry.id === current.id)!;
      expect(current.ingredients[slotIndex]!.selection).toEqual({
        status: "recorded",
        raw: ingredient,
        value: { kind: "item", name: ingredient },
      });
      expect(original.ingredients[slotIndex]!.selection).toMatchObject({
        status: "tentative",
        raw: ingredient + "?",
      });
      expect(current.ingredients[slotIndex]!.quality).toEqual(
        original.ingredients[slotIndex]!.quality,
      );
      expect(currentRecipeFieldSourcesById.get(current.id)?.ingredients).toEqual({
        source: original.source,
        userDecision: { id: "user-recipe-decisions-20260928", recipeId: current.id },
      });
      expect(current.verification).toBe("image-transcribed-game-unverified");
    }
    expect(recipeDecisions.gameVerified).toBe(false);
  });

  it("梦幻草莓奶蛋糕的双奶、金色草莓和视觉槽位整体跟随小铭", () => {
    const cake = recipe("梦幻草莓奶蛋糕");
    const source = supplementalRecipesById.get(cake.id)!;
    expect(cake.ingredients).toEqual(source.ingredients);
    expect(cake.visualCues.filter((cue) => cue.field.startsWith("ingredients."))).toEqual(
      source.visualCues.filter((cue) => cue.field.startsWith("ingredients.")),
    );
    expect(cake.ingredients.map((slot) => slot.quality.status)).toEqual([
      "not-stated",
      "not-stated",
      "not-stated",
      "interpreted",
    ]);
    expect(cake.ingredients[3]!.quality).toMatchObject({
      color: "gold",
      interpretationId: "xiaoming-0927-ingredient-background",
    });
    expect(currentRecipeFieldSourcesById.get(cake.id)?.ingredients).toEqual({
      source: source.source,
      userDecision: { id: "user-recipe-decisions-20260928", recipeId: cake.id },
    });
    expect(cake.tags.raw).toBe("甜点");
  });

  it("用户决定拒绝重复、无效菜谱、错槽、错原文与错来源，不能扩大确认范围", () => {
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
    const invalidSource = structuredClone(recipeDecisions);
    const adopted = invalidSource.decisions.find((entry) => entry.action === "use-ingredients")!;
    if (adopted.action === "use-ingredients") adopted.source.row++;
    expect(recipeDecisionsSchema.safeParse(invalidSource).success).toBe(false);
    expect(
      recipeDecisionsSchema.safeParse({ ...recipeDecisions, gameVerified: true }).success,
    ).toBe(false);
  });

  it("品质跟随主体槽位，等级与菜品底色独立，小铭只补充未收录菜", () => {
    const shrimp = recipe("水果烤虾拼盘");
    expect(shrimp.ingredients.map((slot) => slot.quality.status)).toEqual([
      "interpreted",
      "not-stated",
      "not-stated",
    ]);
    expect(shrimp.ingredients[0]!.quality).toMatchObject({
      color: "purple",
      interpretationId: "ingredient-background-user-20260926",
    });
    expect(shrimp.guideDetails?.levelRaw).toBe("七级");
    expect(shrimp.dishCategory.status).toBe("not-stated");
    expect(currentRecipeQualitiesById.get(shrimp.id)).toMatchObject({
      color: "gold",
      source: { guideId: "tomorrow-20260924-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("竹香苹果冰").id)).toMatchObject({
      color: "purple",
      source: { guideId: "tomorrow-20260924-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("独角仙米面包").id)).toMatchObject({
      color: "purple",
      source: { guideId: "xiaoming-0927-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("甜饼果茶").id)?.status).toBe("unknown");
    expect(getRecipeDifferences(shrimp.id)).toContainEqual(
      expect.objectContaining({
        field: "ingredientQuality",
        previous: "第 2 项 虾：紫",
        current: "第 1 项 虾：紫",
      }),
    );
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
      value: 70,
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
    expect(dish.specialEffect.raw).toBe("大力播撒 一阶");
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
