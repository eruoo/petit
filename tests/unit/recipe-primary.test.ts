import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import {
  primaryRecipeDataset,
  supplementalRecipeDataset,
  supplementalRecipesById,
  september30XiaomingRecipeDataset,
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
import {
  applyReferenceSupplement,
  buildReferenceRecipes,
  referenceSupplements,
  referenceSupplementsSchema,
} from "../../shared/recipes/references";

const recipe = (name: string) => currentRecipes.find((entry) => entry.name.raw === name)!;

describe("小铭 10/14 主体与历史资料的读取边界", () => {
  it("独立覆盖 115 行，保留已有 ID，新增地三鲜不漏录", () => {
    expect(primaryRecipeDataset.inventory.regions.map((region) => region.expectedRows)).toEqual([
      37, 33, 14, 9, 14, 8,
    ]);
    expect(primaryRecipeDataset.recipes).toHaveLength(115);
    expect(
      supplementalRecipeDataset.inventory.regions.map((region) => region.expectedRows),
    ).toEqual([37, 33, 14, 9, 10, 8]);
    expect(currentRecipes).toHaveLength(115);
    expect(new Set(currentRecipes.map((entry) => entry.id)).size).toBe(115);
    const ids = new Set(currentRecipes.map((entry) => entry.id));
    for (const dataset of [
      september30XiaomingRecipeDataset,
      previousXiaomingRecipeDataset,
      supplementalRecipeDataset,
      recipeDataset,
    ])
      expect(dataset.recipes.every((entry) => ids.has(entry.id))).toBe(true);
    expect(recipe("地三鲜").id).toBe("xm-1014-neighbor-008");
    for (const dataset of [
      primaryRecipeDataset,
      supplementalRecipeDataset,
      september30XiaomingRecipeDataset,
      previousXiaomingRecipeDataset,
    ]) {
      const missing = structuredClone(dataset);
      missing.recipes.pop();
      expect(recipeDatasetSchema.safeParse(missing).success).toBe(false);
    }
    for (const entry of currentRecipes) {
      expect(entry.verification).toBe("image-transcribed-game-unverified");
      expect(currentSourceRow(entry)?.nameRaw).toBe(entry.name.raw);
    }
    expect(buildReferenceRecipes()).toEqual([]);
    expect(() => verifySourceAssets(recipeDataset.sources)).not.toThrow();
  });

  it("明天 9/29 补充词条、产出与奇迹盛宴力气，不修改任一原始转录", () => {
    expect(currentRecipeSources.map((source) => source.id)).toEqual([
      "xiaoming-1014-image",
      "tomorrow-20260929-image",
    ]);
    const before = JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset]);
    for (const primary of primaryRecipeDataset.recipes) {
      const current = resolveCurrentRecipe(primary);
      expect(current.id).toBe(primary.id);
      expect(current.guideDetails?.levelRaw).toBe(primary.guideDetails?.levelRaw);
      const supplemental = supplementalRecipesById.get(primary.id);
      expect(current.tags).toEqual(supplemental?.tags ?? primary.tags);
      expect(current.productionChance).toEqual(
        supplemental?.productionChance ?? primary.productionChance,
      );
    }
    expect(JSON.stringify([primaryRecipeDataset, supplementalRecipeDataset])).toBe(before);
    const cake = recipe("梦幻草莓奶蛋糕");
    expect(cake.tags.raw).toBe("甜点");
    expect(currentRecipeFieldSourcesById.get(cake.id)).toMatchObject({
      recipe: { sourceId: "xiaoming-1014-image", region: "guest", row: 12 },
      tags: { sourceId: "tomorrow-20260929-image" },
      energy: { source: { sourceId: "xiaoming-1014-image" } },
      guideDetails: { sourceId: "xiaoming-1014-image" },
    });
    expect(recipe("甜饼果茶").tags.raw).toBe("饮品");
    expect(recipe("轰炸大菇肉").tags.raw).toBe("荤素菜/炸物");
    expect(recipe("地三鲜").tags.status).toBe("not-stated");
  });

  it("10/14 写明 9/30 的问号，旧图原始转录仍保留问号", () => {
    for (const entry of primaryRecipeDataset.recipes) {
      expect(entry.name.status).toBe("recorded");
      expect(entry.ingredients.every((slot) => slot.selection.status === "recorded")).toBe(true);
    }
    const current = recipe("外婆菜饭");
    const september30 = september30XiaomingRecipeDataset.recipes.find(
      (entry) => entry.id === current.id,
    )!;
    expect(september30.ingredients[3]!.selection).toMatchObject({
      status: "tentative",
      raw: "谷物?",
    });
    expect(current.ingredients[3]!.selection).toEqual({
      status: "recorded",
      raw: "谷物",
      value: { kind: "category", name: "谷物" },
    });
    expect(current.ingredients[3]!.quality).toMatchObject({ color: "gold" });
    expect(currentRecipeFieldSourcesById.get(current.id)?.ingredients).toEqual({
      source: current.source,
      userDecision: undefined,
    });
    for (const [name, raws] of [
      ["漫香果麦奶", ["水果", "小麦", "奶"]],
      ["梦幻三仙过海鱼", ["海鱼", "蘑菇", "番茄"]],
      ["梦幻番茄汤汁面", ["大蒜", "小麦", "奶", "番茄"]],
      ["梦幻金玉满堂饭", ["肉", "蛋", "蔬菜", "水稻"]],
      ["梦幻星莓漫游派", ["鱼类", "小麦", "贝类", "蓝莓"]],
    ] as const)
      expect(recipe(name).ingredients.map((slot) => slot.selection.raw)).toEqual(raws);
    expect(recipe("梦幻什锦饮").name.status).toBe("recorded");
    expect(recipe("珍稀什锦砂锅").energy).toMatchObject({ value: 70 });
    expect(recipe("花香蜜瓜派").cookingMethod.raw).toBe("煮锅");
    expect(getRecipeDifferences(recipe("梦幻星莓漫游派").id)).toContainEqual(
      expect.objectContaining({ field: "ingredients", current: "鱼类 + 小麦 + 贝类 + 蓝莓" }),
    );
  });

  it("按用户 2026-11-10 决定，冲突差异采用 10/14 原文", () => {
    expect(recipeDecisions).toMatchObject({
      id: "user-recipe-decisions-20261110",
      statementRaw: "A，差异全部采用新图",
      gameVerified: false,
    });
    expect(recipeDecisions.decisions.map((decision) => decision.nameRaw)).toEqual([
      "甜饼果茶",
      "时蔬烧烤派对",
      "蒜香流心奶棉包",
      "梦幻双色升鱼筵",
      "红穗绛桃包",
      "橙香桃包",
      "斑斓桃包",
      "蓝莓桃包",
    ]);
    expect(recipeDecisions.decisions.every((decision) => decision.action === "keep-primary")).toBe(
      true,
    );
    const tea = recipe("甜饼果茶");
    expect(tea.cookingMethod.raw).toBe("榨汁机");
    expect(tea.specialEffect).toEqual({ status: "not-stated", raw: "" });
    expect(tea.guideDetails?.acquisitionRaw).toBe("任务");
    expect(supplementalRecipesById.get(tea.id)!.cookingMethod.raw).toBe("煮锅");
    expect(recipe("时蔬烧烤派对").specialEffect.raw).toBe("快速翻土 三阶");
    for (const name of [
      "蒜香流心奶棉包",
      "梦幻双色升鱼筵",
      "梦幻鲜风龙虾锅",
      "田园蔬荟披萨",
      "鲜笃鱼汤",
    ]) {
      const current = recipe(name);
      expect(current.name).toMatchObject({ status: "recorded", raw: name });
      expect(currentRecipeFieldSourcesById.get(current.id)?.name).toEqual({
        source: current.source,
        userDecision: undefined,
      });
    }
    expect(recipe("蒜香流心奶棉包").reviewNotes).toHaveLength(1);
    expect(recipe("蒜香流心奶棉包").guideDetails?.levelRaw).toBe("七级");
    expect(
      currentRecipes.some((entry) => /仙风|蔬烩|鲜笋|奶面包|升鱼宴/u.test(entry.name.raw)),
    ).toBe(false);
  });

  it("食材顺序、重复槽位、合并格及品质需求按 10/14 读取", () => {
    const cake = recipe("梦幻草莓奶蛋糕");
    expect(cake.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "奶",
      "奶",
      "小麦",
      "草莓",
    ]);
    expect(cake.ingredients[3]!.quality).toMatchObject({
      color: "gold",
      interpretationId: "xiaoming-1014-ingredient-background",
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
      source: { guideId: "xiaoming-1014-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("谷物粥").id)).toMatchObject({
      color: "blue",
      source: { guideId: "tomorrow-20260929-image" },
    });
    expect(currentRecipeQualitiesById.get(recipe("甜饼果茶").id)).toEqual({
      recipeId: recipe("甜饼果茶").id,
      status: "referenced",
      color: "blue",
      qualityRaw: "Uncommon",
      referenceId: "user-reference-supplements-20261102",
    });
  });

  it("秘制菜 14 行按 10/14 读取，桃包与地三鲜来自图片", () => {
    const neighbors = currentRecipes.filter((entry) => entry.source.region === "neighbor");
    expect(neighbors.map((entry) => entry.name.raw)).toEqual([
      "竹香苹果冰",
      "独角仙米面包",
      "冬虫夏草煲",
      "卡拉红汁炖肉",
      "露营方便烤鱼",
      "百果甜甜圈",
      "云朵小饼干",
      "地三鲜",
      "轰炸大菇肉",
      "红穗绛桃包",
      "橙香桃包",
      "斑斓桃包",
      "蓝莓桃包",
      "甜饼果茶",
    ]);
    const dish = recipe("地三鲜");
    expect(dish.ingredients.map((slot) => [slot.selection.raw, slot.quality.status])).toEqual([
      ["土豆", "not-stated"],
      ["茄子", "interpreted"],
      ["辣椒", "not-stated"],
    ]);
    expect(dish).toMatchObject({
      cookingMethod: { raw: "煮锅" },
      energy: { value: 80 },
      specialEffect: { raw: "大力播洒 一阶" },
      guideDetails: { acquisitionRaw: "鹤玉" },
    });
    expect(currentRecipeQualitiesById.get(dish.id)).toMatchObject({ color: "purple" });
    for (const [name, fruit, effect] of [
      ["橙香桃包", "黄色水果", "大力播洒 一阶"],
      ["斑斓桃包", "绿色水果", ""],
      ["蓝莓桃包", "蓝色水果", ""],
    ] as const) {
      const bun = recipe(name);
      expect(bun.source.sourceId).toBe("xiaoming-1014-image");
      expect(bun.ingredients.map((slot) => slot.selection.raw)).toEqual(["小麦", fruit]);
      expect(bun.cookingMethod.raw).toBe("烤箱");
      expect(bun.specialEffect.raw).toBe(effect);
      expect(bun.guideDetails?.acquisitionRaw).toBe("蛮蛮切磋");
      expect(bun.tags).toMatchObject({ status: "recorded", value: ["甜点"] });
      expect(currentRecipeQualitiesById.get(bun.id)).toMatchObject({
        status: "recorded",
        color: "purple",
      });
    }
    expect(recipe("红穗绛桃包").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "小麦",
      "水果",
    ]);
    const meatshrooms = recipe("轰炸大菇肉");
    expect(meatshrooms.ingredients.map((slot) => slot.selection.raw)).toEqual(["蘑菇", "海鲜"]);
    expect(meatshrooms.ingredients[1]!.quality).toMatchObject({
      interpretationId: "xiaoming-1014-ingredient-background",
    });
    expect(meatshrooms).toMatchObject({
      energy: { value: 90 },
      specialEffect: { raw: "大力敲伐 二阶" },
      guideDetails: { acquisitionRaw: "热贝尔" },
    });
    expect(currentRecipeFieldSourcesById.get(meatshrooms.id)?.reference).toBeUndefined();
    expect(recipe("卡拉红汁炖肉").energy).toMatchObject({ status: "recorded", value: 90 });
    expect(recipe("百果甜甜圈").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "水果",
      "小麦",
    ]);
    expect(recipe("露营方便烤鱼").ingredients.map((slot) => slot.quality.status)).toEqual([
      "interpreted",
      "not-stated",
    ]);
    expect(recipeSchema.safeParse({ ...dish, energy: { ...dish.energy, value: 0 } }).success).toBe(
      false,
    );
  });

  it("奇迹盛宴按 10/14 顺序，力气与产出由明天 9/29 补充，不猜配方或效果", () => {
    const miracles = currentRecipes.filter((entry) => entry.source.region === "miracle");
    expect(miracles.map((entry) => [entry.name.raw, entry.tags.raw])).toEqual([
      ["奇迹盛宴大锅炖", "炖菜"],
      ["奇迹盛宴大烤串", "烧烤"],
      ["奇迹盛宴丰年饭", "主食"],
      ["奇迹盛宴极火炒", "炒菜"],
      ["奇迹盛宴甜点塔", "甜点"],
      ["奇迹盛宴瓦罐汤", "汤羹"],
      ["奇迹盛宴炸串碗", "炸物"],
      ["奇迹盛宴畅饮桶", "饮品"],
    ]);
    for (const entry of miracles) {
      const primary = primaryRecipeDataset.recipes.find((item) => item.id === entry.id)!;
      expect(primary.energy.status).toBe("not-stated");
      expect(primary.tags).toMatchObject({
        status: "not-stated",
        reason: expect.stringContaining("来源"),
      });
      expect(entry.energy).toMatchObject({ status: "recorded", value: 180 });
      expect(currentRecipeFieldSourcesById.get(entry.id)?.energy.source).toEqual(
        supplementalRecipesById.get(entry.id)!.source,
      );
      expect(entry.ingredients).toEqual([]);
      expect(entry.cookingMethod.status).toBe("not-stated");
      expect(entry.specialEffect.status).toBe("not-stated");
      expect(entry.effectTrigger.status).toBe("not-stated");
      expect(entry.productionChance).toEqual({
        status: "unspecified-probability",
        raw: "概率产出",
        basis: "region-heading",
      });
      expect(
        recipeSchema.safeParse({
          ...entry,
          productionChance: { ...entry.productionChance, percent: 10 },
        }).success,
      ).toBe(false);
      expect(
        recipeSchema.safeParse({ ...entry, source: { ...entry.source, region: "free" } }).success,
      ).toBe(false);
    }
  });

  it("用户决定拒绝重复、错误菜谱、错误原文与错误来源引用", () => {
    const duplicate = structuredClone(recipeDecisions);
    duplicate.decisions.push(duplicate.decisions[0]!);
    expect(recipeDecisionsSchema.safeParse(duplicate).success).toBe(false);
    for (const patch of [{ recipeId: "missing-id" }, { nameRaw: "错误原文" }]) {
      const broken = structuredClone(recipeDecisions);
      Object.assign(broken.decisions[0]!, patch);
      expect(recipeDecisionsSchema.safeParse(broken).success).toBe(false);
    }
    expect(
      recipeDecisionsSchema.safeParse({ ...recipeDecisions, gameVerified: true }).success,
    ).toBe(false);
    const tea = recipe("甜饼果茶");
    const useFields = {
      ...recipeDecisions,
      decisions: [
        {
          recipeId: tea.id,
          nameRaw: "甜饼果茶",
          action: "use-fields",
          fields: ["cookingMethod"],
          source: supplementalRecipesById.get(tea.id)!.source,
        },
      ],
    };
    expect(recipeDecisionsSchema.safeParse(useFields).success).toBe(true);
    const wrongRow = structuredClone(useFields);
    wrongRow.decisions[0]!.source.row = 999;
    expect(recipeDecisionsSchema.safeParse(wrongRow).success).toBe(false);
    const repeated = structuredClone(useFields);
    repeated.decisions[0]!.fields.push("cookingMethod");
    expect(recipeDecisionsSchema.safeParse(repeated).success).toBe(false);
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
    expect(gameEffectEvidence.references).toHaveLength(3);
    expect(
      currentRecipes.filter(
        (entry) => entry.specialEffect.status === "recorded" && !getEffectEvidence(entry)?.limit,
      ),
    ).toEqual([]);
    expect(getEffectEvidence(recipe("梦幻草莓奶蛋糕"))).toMatchObject({
      limit: { unit: "uses", value: 15 },
      limitEvidenceIds: ["xbgdwiki-mighty-strike-3"],
      screenshots: [],
    });
    expect(getEffectEvidence(recipe("梦幻奇迹蒜龙虾"))?.limit).toEqual({
      unit: "seconds",
      value: 60,
    });
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

describe("用户要求的外部参考补齐", () => {
  it("10/14 写明的字段改读图片，只保留图中没有的词条与甜饼果茶品质", () => {
    expect(referenceSupplements.gameVerified).toBe(false);
    expect(referenceSupplements.additions).toEqual([]);
    expect(
      referenceSupplements.recipes.map((entry) => [
        entry.nameRaw,
        currentRecipeFieldSourcesById.get(entry.recipeId)?.reference?.fields,
      ]),
    ).toEqual([
      ["云朵小饼干", ["tags"]],
      ["甜饼果茶", ["quality"]],
      ["橙香桃包", ["tags"]],
      ["斑斓桃包", ["tags"]],
      ["蓝莓桃包", ["tags"]],
    ]);
    const cookie = recipe("云朵小饼干");
    expect(cookie.ingredients.map((slot) => [slot.selection.raw, slot.quality.status])).toEqual([
      ["小麦", "interpreted"],
      ["奶", "not-stated"],
    ]);
    expect(cookie.energy).toEqual({ status: "recorded", raw: "70", value: 70 });
    expect(cookie.tags).toMatchObject({ status: "recorded", value: ["甜点"] });
    expect(cookie.specialEffect).toEqual({ status: "not-stated", raw: "" });
    expect(currentRecipeFieldSourcesById.get(recipe("谷物粥").id)?.reference).toBeUndefined();
    expect([...currentRecipeQualitiesById.values()].some((q) => q.status === "unknown")).toBe(
      false,
    );
    expect(referenceSupplements.requests.map((request) => request.id)).toEqual([
      "user-reference-request-20261102-gaps",
      "user-reference-request-20261102-conflicts",
      "user-reference-request-20261102-peach-buns",
    ]);
    const fake = structuredClone(primaryRecipeDataset);
    fake.recipes[0]!.verification = "reference-compiled-game-unverified";
    expect(recipeDatasetSchema.safeParse(fake).success).toBe(false);
  });

  it("改写声明的原文变化时拒绝套用", () => {
    const base = primaryRecipeDataset.recipes.find((entry) => entry.name.raw === "红穗绛桃包")!;
    const override = (ingredients: string[]) => ({
      ...referenceSupplements,
      recipes: [
        {
          recipeId: base.id,
          nameRaw: "红穗绛桃包",
          requestId: "user-reference-request-20261102-conflicts",
          sourceIds: [referenceSupplements.sources[0]!.id],
          overrides: { ingredients },
          ingredients: [
            {
              raw: "红色水果",
              value: { kind: "category" as const, name: "红色水果" },
              sourceRaw: { en: "Red Fruit", zh: "红色水果" },
            },
          ],
          notes: [],
        },
      ],
    });
    expect(() => applyReferenceSupplement(base, override(["小麦", "苹果"]))).toThrow(
      /需重新确认改写/u,
    );
    expect(
      applyReferenceSupplement(base, override(["小麦", "水果"])).ingredients[0]!.selection.raw,
    ).toBe("红色水果");
  });

  it("拒绝覆盖图片已有值、菜名不符、引用缺失与游戏实测声明", () => {
    const filled = structuredClone(referenceSupplements);
    filled.recipes[0]!.energy = { raw: "70", value: 70, sourceRaw: { en: "70", zh: "70" } };
    expect(() => applyReferenceSupplement(recipe("云朵小饼干"), filled)).toThrow(
      /不能用参考资料覆盖/u,
    );
    // 词条可补齐小铭图没有的列，但空白效果不能被参考资料改写。
    const blankEffect = structuredClone(referenceSupplements);
    const pandan = blankEffect.recipes.find((entry) => entry.nameRaw === "斑斓桃包")!;
    pandan.specialEffect = {
      raw: "快速翻土 一阶",
      value: { name: "快速翻土", tier: 1 },
      sourceRaw: { en: "Quick Till I", zh: "" },
    };
    const pandanPrimary = primaryRecipeDataset.recipes.find(
      (entry) => entry.id === pandan.recipeId,
    )!;
    expect(() => applyReferenceSupplement(pandanPrimary, blankEffect)).toThrow(
      /不能用参考资料覆盖/u,
    );
    const renamed = structuredClone(referenceSupplements);
    renamed.recipes[0]!.nameRaw = "别的菜";
    expect(() =>
      applyReferenceSupplement(supplementalRecipesById.get(renamed.recipes[0]!.recipeId)!, renamed),
    ).toThrow(/菜名不符/u);
    const missing = structuredClone(referenceSupplements);
    missing.recipes[0]!.sourceIds.push("missing-source");
    expect(referenceSupplementsSchema.safeParse(missing).success).toBe(false);
    expect(
      referenceSupplementsSchema.safeParse({ ...referenceSupplements, gameVerified: true }).success,
    ).toBe(false);
  });
});
