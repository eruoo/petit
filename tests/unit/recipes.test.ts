import { describe, expect, it } from "vitest";
import { verifySourceAssets } from "../../scripts/check-recipes.ts";
import { recipeDataset } from "../../shared/recipes/index.ts";
import { collectRecipeReviewItems } from "../../shared/recipes/review.ts";
import {
  energySchema,
  ingredientSlotSchema,
  recipeDatasetSchema,
  recipeSchema,
} from "../../shared/recipes/schema.ts";
import type { Recipe, RecipeDataset } from "../../shared/recipes/schema.ts";

function at(region: Recipe["source"]["region"], row: number) {
  const recipe = recipeDataset.recipes.find(
    (entry) => entry.source.region === region && entry.source.row === row,
  );
  if (!recipe) throw new Error(`缺少测试样本 ${region}/${row}`);
  return recipe;
}

describe("图片转录与独立清点", () => {
  it("按原图人工清点的五区数量覆盖每一行，并校验原尺寸附件", () => {
    // 独立读取原图得到的常量，不用待测数据计算预期数量。
    const counts = { simple: 37, signature: 33, guest: 10, free: 9, neighbor: 1 };
    expect(recipeDataset.recipes).toHaveLength(90);
    for (const [region, expected] of Object.entries(counts)) {
      expect(
        recipeDataset.recipes
          .filter((recipe) => recipe.source.region === region)
          .map((recipe) => recipe.source.row),
      ).toEqual(Array.from({ length: expected }, (_, index) => index + 1));
    }
    expect(() => verifySourceAssets(recipeDataset.sources)).not.toThrow();
    expect(recipeDataset.sources[0]?.asset).toMatchObject({
      width: 4355,
      height: 2189,
      bytes: 6625241,
    });
  });

  it("附件变化后不会继续声称哈希校验通过", () => {
    const sources = structuredClone(recipeDataset.sources);
    sources[0]!.asset.sha256 = "0".repeat(64);
    expect(() => verifySourceAssets(sources)).toThrow("SHA-256 不符");
  });

  const brokenDatasets: [string, (data: RecipeDataset) => void][] = [
    [
      "重复菜谱 ID",
      (data) => {
        data.recipes[1]!.id = data.recipes[0]!.id;
      },
    ],
    [
      "重复来源 ID",
      (data) => {
        data.sources.push(structuredClone(data.sources[0]!));
      },
    ],
    [
      "不存在的来源",
      (data) => {
        data.recipes[0]!.source.sourceId = "missing-image";
      },
    ],
    [
      "不存在的图片行",
      (data) => {
        data.recipes[0]!.source.row = 999;
      },
    ],
    [
      "重复引用同一图片行",
      (data) => {
        data.recipes[1]!.source = { ...data.recipes[0]!.source };
      },
    ],
    [
      "漏录一行",
      (data) => {
        data.recipes.pop();
      },
    ],
    [
      "缺失注释引用",
      (data) => {
        data.recipes[0]!.noteIds.push("missing-note");
      },
    ],
    [
      "丢失友邻解锁条件",
      (data) => {
        data.recipes.at(-1)!.noteIds = ["shrimp-exclusion"];
      },
    ],
    [
      "清点定位超出原图",
      (data) => {
        data.inventory.regions[0]!.rows[0]!.bounds[0] = 5000;
      },
    ],
  ];
  it.each(brokenDatasets)("拒绝%s", (_label, mutate) => {
    const data = structuredClone(recipeDataset);
    mutate(data);
    expect(recipeDatasetSchema.safeParse(data).success).toBe(false);
  });
});

describe("容易失真的食材和字段", () => {
  it.each([
    ["simple", 8, ["小麦", "小麦"]],
    ["simple", 30, ["稻米", "稻米"]],
    ["signature", 7, ["竹笋", "竹笋", "蟹类"]],
    ["signature", 21, ["小麦", "小麦", "蔬菜类"]],
    ["guest", 7, ["鱼类", "稻米", "稻米", "蔬菜类"]],
  ] as const)("保留 %s/%i 的有序重复食材", (region, row, expected) => {
    expect(at(region, row).ingredients.map((slot) => slot.selection.raw)).toEqual(expected);
  });

  it("同时支持具体食材、类别、同一槽位的可选关系", () => {
    expect(at("simple", 3).ingredients[0]?.selection).toMatchObject({
      value: { kind: "item", name: "蘑菇" },
    });
    expect(at("simple", 4).ingredients[0]?.selection).toMatchObject({
      value: { kind: "category", name: "鱼类" },
    });
    expect(at("simple", 1).ingredients[0]?.selection).toMatchObject({
      raw: "水果类/鲜花",
      value: {
        kind: "any-of",
        options: [
          { kind: "category", name: "水果类" },
          { kind: "unspecified", name: "鲜花" },
        ],
      },
    });
    expect(at("free", 1).ingredients).toHaveLength(2);
    expect(at("free", 1).ingredients[0]?.selection).toEqual(
      at("free", 1).ingredients[1]?.selection,
    );
  });

  it("招牌菜最后一行允许四个食材槽位，后续字段没有错位", () => {
    const recipe = at("signature", 33);
    expect(recipe.ingredients.map((slot) => slot.selection.raw)).toEqual([
      "龙虾",
      "大蒜",
      "蔬菜类",
      "贝类",
    ]);
    expect(recipe.cookingMethod).toMatchObject({ value: "烤箱" });
    expect(recipe.energy).toMatchObject({ value: 140 });
    expect(recipe.tags).toMatchObject({ raw: "荤素菜/烧烤" });
    expect(recipe.specialEffect).toMatchObject({
      raw: "轻盈潜行 三阶",
      value: { name: "轻盈潜行", tier: 3 },
    });
  });

  it("候选茄子与纯问号食材不同，不能访问一个虚构的已知值", () => {
    const candidate = at("signature", 3).ingredients[0]!.selection;
    const unknown = at("guest", 9).ingredients[1]!.selection;
    expect(candidate).toMatchObject({
      status: "tentative",
      raw: "茄子?",
      candidate: { kind: "item", name: "茄子" },
    });
    expect(candidate).not.toHaveProperty("value");
    expect(unknown).toMatchObject({ status: "unknown", raw: "?" });
    expect(unknown).not.toHaveProperty("value");
    expect(
      ingredientSlotSchema.safeParse({
        ...at("guest", 9).ingredients[1],
        selection: { ...unknown, value: { kind: "item", name: "茄子" } },
      }).success,
    ).toBe(false);
  });

  it("未知力气不填成 0；字段必须与原图数字一致", () => {
    expect(at("free", 5).energy).toMatchObject({ status: "unknown", raw: "?" });
    expect(at("free", 6).energy).not.toHaveProperty("value");
    expect(energySchema.safeParse({ status: "recorded", raw: "?", value: 0 }).success).toBe(false);
    expect(energySchema.safeParse({ status: "recorded", raw: "70", value: 0 }).success).toBe(false);
    expect(energySchema.safeParse({ status: "recorded", raw: "0", value: 0 }).success).toBe(true);
  });

  it.each([-1, 1.5, "70", null, Number.NaN, Number.POSITIVE_INFINITY])(
    "拒绝无效力气值 %s",
    (value) => {
      expect(
        energySchema.safeParse({ status: "recorded", raw: String(value), value }).success,
      ).toBe(false);
    },
  );

  it("空白、斜杠、未知和明确无效果具有不同状态", () => {
    expect(at("free", 1).specialEffect).toEqual({ status: "not-stated", raw: "" });
    expect(at("simple", 1).specialEffect).toMatchObject({ status: "unresolved", raw: "/" });
    const recipe = structuredClone(at("free", 1));
    recipe.specialEffect = {
      status: "none",
      raw: "无",
      reason: "仅用来验证显式不存在的模型分支；不是源数据",
    };
    expect(recipeSchema.safeParse(recipe).success).toBe(true);
    recipe.specialEffect.raw = "/";
    expect(recipeSchema.safeParse(recipe).success).toBe(false);
  });

  it("检查烹饪方式枚举、效果阶级范围以及原文一致性", () => {
    const recipe = at("signature", 33);
    expect(
      recipeSchema.safeParse({
        ...recipe,
        cookingMethod: { status: "recorded", raw: "炒锅", value: "炒锅" },
      }).success,
    ).toBe(false);
    expect(
      recipeSchema.safeParse({
        ...recipe,
        specialEffect: {
          status: "recorded",
          raw: "轻盈潜行 四阶",
          value: { name: "轻盈潜行", tier: 4 },
        },
      }).success,
    ).toBe(false);
    expect(
      recipeSchema.safeParse({
        ...recipe,
        specialEffect: {
          status: "recorded",
          raw: "轻盈潜行 三阶",
          value: { name: "轻盈潜行", tier: 2 },
        },
      }).success,
    ).toBe(false);
  });
});

describe("概率、视觉与来源语义", () => {
  it("四个概率出单元格只描述自由烹饪产出，不产生虚构效果或百分比", () => {
    const probabilistic = recipeDataset.recipes.filter(
      (recipe) => recipe.productionChance.status === "unspecified-probability",
    );
    expect(probabilistic.map((recipe) => recipe.source.row)).toEqual([2, 3, 8, 9]);
    for (const recipe of probabilistic) {
      expect(recipe.source.region).toBe("free");
      expect(recipe.specialEffect.status).toBe("not-stated");
      expect(recipe.effectTrigger.status).toBe("not-stated");
      expect(
        recipeSchema.safeParse({
          ...recipe,
          productionChance: { ...recipe.productionChance, percent: 50 },
        }).success,
      ).toBe(false);
    }
    const effect = at("signature", 33);
    expect(effect.effectTrigger).toEqual({
      status: "unspecified-probability",
      raw: "概率",
      basis: "effect-column-heading",
    });
    expect(
      recipeSchema.safeParse({ ...effect, effectTrigger: { ...effect.effectTrigger, rate: 0.5 } })
        .success,
    ).toBe(false);
    expect(
      recipeSchema.safeParse({ ...at("free", 2), effectTrigger: effect.effectTrigger }).success,
    ).toBe(false);
  });

  it("颜色、加粗与品质、分类、效果阶级分开保存", () => {
    const platter = at("signature", 32);
    expect(platter.visualCues).toContainEqual({ field: "name", background: "yellow" });
    expect(platter.visualCues).toContainEqual({ field: "ingredients.0", background: "purple" });
    expect(at("simple", 8).visualCues).toContainEqual({ field: "ingredients.0", bold: true });
    expect(at("guest", 3).visualCues).toContainEqual({ field: "name", background: "purple" });
    expect(
      recipeDataset.recipes.every((recipe) => recipe.dishCategory.status === "not-stated"),
    ).toBe(true);
    expect(
      recipeDataset.recipes
        .flatMap((recipe) => recipe.ingredients)
        .every((slot) => slot.quality.status === "not-stated"),
    ).toBe(true);
  });

  it("保留异写，不在转录时统一为记忆中的名称", () => {
    expect(at("signature", 2).name.raw).toBe("番笋红宋汤");
    expect(at("signature", 14).name.raw).toBe("梦幻双色升鱼宴");
    expect(at("simple", 35).name.raw).toBe("波香烤鱼串");
    expect(at("simple", 35).ingredients[1]?.selection.raw).toBe("菠萝");
    expect(at("signature", 3).specialEffect).toMatchObject({ value: { name: "大力播撒" } });
    expect(at("simple", 12).specialEffect).toMatchObject({ value: { name: "大力播洒" } });
    expect(at("simple", 37).tags.raw).toBe("荤素菜/主菜");
  });

  it("图片日期不是原帖日期或游戏版本，玩家注释保持可追溯", () => {
    const source = recipeDataset.sources[0]!;
    expect(source.imageDate.value).toBe("2026-09-23");
    expect(source.origin.label).toBe("用户提供图片");
    expect(source.origin.originalPostUrl.status).toBe("unknown");
    expect(source.publishedAt.status).toBe("not-stated");
    expect(source.gameVersion.status).toBe("not-stated");
    expect(source.notes.map((note) => note.raw)).toEqual([
      "tips: 虾类不包含螯虾",
      "只能通过自由烹饪得到，不在菜谱内显示",
      "友邻秘方，只能通过友邻赠送获得，且只能在配方解锁后用配方制作",
    ]);
    expect(source.notes.every((note) => note.evidence === "player-record")).toBe(true);
    expect(
      recipeDataset.recipes.every(
        (recipe) => recipe.verification === "image-transcribed-game-unverified",
      ),
    ).toBe(true);
  });

  it("待核对汇总保留字段路径和图片行号，包括无法完全辨读的菜名", () => {
    const items = collectRecipeReviewItems(recipeDataset.recipes);
    expect(items.filter((item) => item.status === "tentative")).toHaveLength(13);
    expect(items.filter((item) => item.status === "unknown")).toHaveLength(5);
    expect(items.filter((item) => item.status === "unresolved")).toHaveLength(36);
    expect(items).toContainEqual(
      expect.objectContaining({ region: "signature", row: 7, field: "name", status: "tentative" }),
    );
    expect(items).toContainEqual(
      expect.objectContaining({
        region: "guest",
        row: 9,
        field: "ingredients.3.selection",
        raw: "?",
      }),
    );
  });
});
