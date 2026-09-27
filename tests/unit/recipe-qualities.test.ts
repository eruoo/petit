import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import {
  recipeQualityDataset,
  recipeQualityDatasetSchema,
  recipeQualitySchema,
  recipeQualitiesById,
  recipeQualityLabel,
  verifyRecipeQualityReferences,
} from "../../shared/recipes/qualities";

describe("独立菜品品质与底色依据", () => {
  it("覆盖 94 道菜，保留 93 个图鉴观察与一个未知项", () => {
    expect(recipeQualitiesById.size).toBe(94);
    expect(recipeQualityDataset.guides).toHaveLength(17);
    for (const [color, expected] of [
      ["blue", 44],
      ["purple", 33],
      ["gold", 16],
    ] as const) {
      expect(
        recipeQualityDataset.recipes.filter(
          (quality) => quality.status !== "unknown" && quality.color === color,
        ),
      ).toHaveLength(expected);
    }
    expect(
      recipeQualityDataset.recipes.filter((quality) => quality.status === "tentative"),
    ).toHaveLength(6);
    const unknown = recipeQualitiesById.get("mt-20260924-neighbor-001")!;
    expect(unknown.status).toBe("unknown");
    expect(recipeQualityLabel(unknown)).toBe("品质待确认");
    expect(recipeQualitySchema.safeParse({ ...unknown, color: "blue" }).success).toBe(false);
    expect(recipeQualityDataset.gameVerified).toBe(false);
    expect(recipeQualityDataset.interpretation.kind).toBe("user-confirmation");
  });

  it("共用图形的九道什锦料理保持各自品质与来源行", () => {
    for (let group = 0; group < 3; group++) {
      const qualities = [1, 2, 3].map((row) =>
        recipeQualitiesById.get(`mt-20260924-free-${String(group * 3 + row).padStart(3, "0")}`)!,
      );
      expect(qualities.map((quality) => quality.status !== "unknown" && quality.color)).toEqual([
        "blue",
        "purple",
        "gold",
      ]);
    }
    expect(recipeQualitiesById.get("mt-20260924-free-005")).toMatchObject({
      color: "purple",
      source: { guideId: "simple-6", row: 5, nameRaw: "珍稀什锦饮" },
    });
  });

  it("不按菜名、分区、食材品质或特殊效果阶级猜测菜品品质", () => {
    expect(recipeQualitiesById.get("mt-20260924-guest-003")).toMatchObject({
      color: "purple",
      status: "tentative",
    });
    expect(recipeQualitiesById.get("mt-20260924-guest-005")).toMatchObject({
      color: "gold",
      status: "recorded",
    });
    expect(recipeQualitiesById.get("mt-20260924-signature-017")).toMatchObject({ color: "blue" });
    expect(
      recipeDataset.recipes.every((recipe) => recipe.dishCategory.status === "not-stated"),
    ).toBe(true);
    const neighbor = recipeDataset.recipes.find(
      (recipe) => recipe.id === "mt-20260924-neighbor-001",
    )!;
    expect(neighbor.ingredients[1]?.quality).toMatchObject({
      status: "interpreted",
      color: "purple",
    });
    expect(recipeQualitiesById.get(neighbor.id)?.status).toBe("unknown");
  });

  it("拒绝重复 ID、来源缺失、越界行号和不存在的菜谱引用", () => {
    const duplicate = structuredClone(recipeQualityDataset);
    duplicate.recipes[1] = duplicate.recipes[0]!;
    expect(recipeQualityDatasetSchema.safeParse(duplicate).success).toBe(false);
    for (const source of [
      { guideId: "missing", row: 1 },
      { guideId: "simple-5", row: 7 },
    ]) {
      const broken = structuredClone(recipeQualityDataset);
      const quality = broken.recipes[0]!;
      if (quality.status === "unknown") throw new Error("fixture must have a source");
      quality.source = { ...quality.source, ...source };
      expect(recipeQualityDatasetSchema.safeParse(broken).success).toBe(false);
    }
    const missingRecipe = structuredClone(recipeQualityDataset);
    missingRecipe.recipes[0]!.recipeId = "missing-recipe";
    expect(() => verifyRecipeQualityReferences(missingRecipe, recipeDataset.recipes)).toThrow(
      "不存在",
    );
    expect(() =>
      verifyRecipeQualityReferences(
        { ...recipeQualityDataset, recipes: [] },
        recipeDataset.recipes,
      ),
    ).toThrow("未知原因");
  });

  it("拒绝未支持的颜色和与原始观察不一致的颜色", () => {
    const blue = recipeQualitiesById.get("mt-20260924-free-004")!;
    expect(recipeQualitySchema.safeParse({ ...blue, color: "green" }).success).toBe(false);
    expect(recipeQualitySchema.safeParse({ ...blue, color: "gold" }).success).toBe(false);
    expect(
      recipeQualityDatasetSchema.safeParse({ ...recipeQualityDataset, gameVerified: true }).success,
    ).toBe(false);
  });

  it("菜名异写保留候选状态，不能因底色可读而提升为确定对应", () => {
    const quality = recipeQualitiesById.get("mt-20260924-simple-008")!;
    expect(quality).toMatchObject({ status: "tentative", source: { nameRaw: "暖暖阳春面" } });
    expect(recipeQualityLabel(quality)).toBe("蓝色品质（候选）");
    const promoted = recipeQualityDatasetSchema.parse({
      ...recipeQualityDataset,
      recipes: recipeQualityDataset.recipes.map((item) => {
        if (item.recipeId !== quality.recipeId || item.status === "unknown") return item;
        return {
          recipeId: item.recipeId,
          status: "recorded",
          color: item.color,
          backgroundRaw: item.backgroundRaw,
          source: item.source,
        };
      }),
    });
    expect(() => verifyRecipeQualityReferences(promoted, recipeDataset.recipes)).toThrow(
      "tentative",
    );
  });
});
