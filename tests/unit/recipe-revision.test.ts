import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index.ts";
import {
  previousRecipeDataset,
  verifyPreviousRecipeReferences,
} from "../../shared/recipes/history.ts";
import { collectRecipeReviewItems } from "../../shared/recipes/review.ts";
import { recipeDatasetSchema, recipeSchema } from "../../shared/recipes/schema.ts";
import wikiArchive from "../../docs/references/recipes/wiki-dish-icons-2026-09-26.json";

const byName = (name: string) => {
  const recipe = recipeDataset.recipes.find((entry) => entry.name.raw === name);
  if (!recipe) throw new Error(`Missing recipe: ${name}`);
  return recipe;
};

describe("9 月 24 日转录与版本对照", () => {
  it("拒绝确定食材的原文与筛选名称错配", () => {
    const broken = structuredClone(recipeDataset);
    const recipe = broken.recipes.find((entry) => entry.id === "mt-20260924-simple-005")!;
    expect(recipe.ingredients[0]!.selection.raw).toBe("海鱼");
    recipe.ingredients[0]!.selection = {
      status: "recorded",
      raw: "海鱼",
      value: { kind: "unspecified", name: "海胆" },
    };
    const result = recipeDatasetSchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["recipes", 4, "ingredients", 0, "selection", "value"],
          message: "确定食材名称或可选项顺序与原文不符",
        }),
      );
    }
  });

  it("覆盖独立清点的 94 行，旧版 90 条按原字节保存且逐条关联", () => {
    const counts = { simple: 37, signature: 33, guest: 14, free: 9, neighbor: 1 };
    expect(recipeDataset.inventory.sourceId).toBe("tomorrow-20260924-image");
    expect(recipeDataset.recipes).toHaveLength(94);
    for (const [region, count] of Object.entries(counts)) {
      const rows = recipeDataset.recipes.filter((recipe) => recipe.source.region === region);
      expect(rows.map((recipe) => recipe.source.row)).toEqual(
        Array.from({ length: count }, (_, index) => index + 1),
      );
      for (const recipe of rows) {
        expect(recipe.id).toBe(
          `mt-20260924-${region}-${String(recipe.source.row).padStart(3, "0")}`,
        );
        expect(recipe.source.sourceId).toBe("tomorrow-20260924-image");
      }
    }
    expect(previousRecipeDataset.recipes).toHaveLength(90);
    const archivedBytes = readFileSync(
      new URL(`../../${wikiArchive.localDataset.path}`, import.meta.url),
    );
    expect(createHash("sha256").update(archivedBytes).digest("hex")).toBe(
      wikiArchive.localDataset.sha256,
    );
    expect(() =>
      verifyPreviousRecipeReferences(recipeDataset, previousRecipeDataset),
    ).not.toThrow();
    expect(recipeDataset.recipes.flatMap((recipe) => recipe.previousRecipeId ?? []).sort()).toEqual(
      previousRecipeDataset.recipes.map((recipe) => recipe.id).sort(),
    );
    expect(
      recipeDataset.recipes
        .filter((recipe) => !recipe.previousRecipeId)
        .map((recipe) => recipe.name.raw),
    ).toEqual(["梦幻金玉满堂饭", "梦幻草莓奶蛋糕", "梦幻星莓漫游派", "梦幻番茄汤汁面"]);
  });

  it.each([
    ["甜瓜花茶", 16, 1, "榨汁机"],
    ["满满大烩菜", 28, 6, "烤箱"],
  ] as const)("%s 的新旧烹饪方式和行号分别保留", (name, oldRow, newRow, method) => {
    const recipe = byName(name);
    const prior = previousRecipeDataset.recipes.find(
      (entry) => entry.id === recipe.previousRecipeId,
    )!;
    expect(prior.source.row).toBe(oldRow);
    expect(prior.cookingMethod.raw).toBe(method);
    expect(recipe.source.row).toBe(newRow);
    expect(recipe.cookingMethod).toMatchObject({ status: "recorded", value: "煮锅" });
    expect(recipe.reviewNotes).toContainEqual(expect.objectContaining({ field: "cookingMethod" }));
  });

  it("补全的食材按新版原文记录，保留重复槽位、四食材和剩余问号", () => {
    expect(byName("甜瓜花茶").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "甜瓜",
      "鲜花",
      "甜瓜",
    ]);
    expect(byName("时蔬烧烤派对").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "番茄",
      "胡萝卜",
      "土豆",
      "黄瓜",
    ]);
    expect(byName("梦幻奇迹蒜龙虾").ingredients.map((slot) => slot.selection.raw)).toEqual([
      "龙虾",
      "大蒜",
      "蔬菜类",
      "贝类",
    ]);
    expect(byName("梦幻番茄汤汁面").ingredients[3]?.selection).toMatchObject({
      status: "unknown",
      raw: "?",
    });
    expect(byName("梦幻草莓奶蛋糕").ingredients[3]?.selection).toMatchObject({
      status: "tentative",
      raw: "火龙果?",
      candidate: { name: "火龙果" },
    });
    // 新增梦幻菜里的草莓没有问号，不能据此抹掉另一道菜自己的问号。
    expect(byName("草莓奶蛋糕").ingredients[0]?.selection).toMatchObject({
      status: "tentative",
      raw: "草莓?",
    });
  });

  it("两条未知力气被原图补全，九条概率出仍仅表示产出", () => {
    expect(byName("珍稀什锦饮").energy).toEqual({ status: "recorded", raw: "60", value: 60 });
    expect(byName("梦幻什锦饮").energy).toEqual({ status: "recorded", raw: "100", value: 100 });
    expect(recipeDataset.recipes.every((recipe) => recipe.energy.status === "recorded")).toBe(true);
    const free = recipeDataset.recipes.filter((recipe) => recipe.source.region === "free");
    expect(free).toHaveLength(9);
    for (const recipe of free) {
      expect(recipe.productionChance).toEqual({
        status: "unspecified-probability",
        raw: "概率出",
        basis: "effect-column-cell",
      });
      expect(recipe.specialEffect.status).toBe("not-stated");
      expect(recipe.effectTrigger.status).toBe("not-stated");
      expect(
        recipeSchema.safeParse({
          ...recipe,
          productionChance: { ...recipe.productionChance, percent: 50 },
        }).success,
      ).toBe(false);
    }
  });

  it("新版注释、视觉线索和未验证状态保留，不冒充游戏版本结论", () => {
    const source = recipeDataset.sources.find(
      (entry) => entry.id === recipeDataset.inventory.sourceId,
    )!;
    expect(source.imageDate.value).toBe("2026-09-24");
    expect(source.notes[0]?.raw).toBe("tips: 虾类不包含螯虾 海鲜为赶海生物 甜瓜属于绿色水果");
    expect(source.gameVersion.status).toBe("not-stated");
    expect(source.publishedAt.status).toBe("not-stated");
    for (const recipe of recipeDataset.recipes) {
      expect(recipe.noteIds).toContain("ingredient-notes");
      expect(recipe.verification).toBe("image-transcribed-game-unverified");
      expect(recipe.dishCategory.status).toBe("not-stated");
    }
    for (let index = 0; index < 4; index++) {
      expect(byName("时蔬烧烤派对").visualCues).toContainEqual({
        field: `ingredients.${index}`,
        background: "purple",
        bold: true,
      });
    }
    const reviews = collectRecipeReviewItems(recipeDataset.recipes);
    expect(reviews.filter((item) => item.status === "tentative")).toHaveLength(7);
    expect(reviews.filter((item) => item.status === "unknown")).toHaveLength(1);
    expect(reviews.filter((item) => item.status === "unresolved")).toHaveLength(36);
    expect(reviews.filter((item) => item.status === "review-note")).toHaveLength(16);
  });

  it.each(["missing-id", "mt-20260923-simple-002", undefined])(
    "拒绝不存在、错配或遗漏的旧版引用 %s",
    (reference) => {
      const broken = structuredClone(recipeDataset);
      broken.recipes[0]!.previousRecipeId = reference;
      expect(() => verifyPreviousRecipeReferences(broken, previousRecipeDataset)).toThrow();
    },
  );

  it("拒绝同一旧版记录被重复引用", () => {
    const broken = structuredClone(recipeDataset);
    broken.recipes.push(structuredClone(broken.recipes[0]!));
    expect(() => verifyPreviousRecipeReferences(broken, previousRecipeDataset)).toThrow(
      "重复引用旧版记录",
    );
  });
});
