import { z } from "zod";
import data from "../../data/recipes/qualities.json" with { type: "json" };
import { recipeDataset } from "./index.ts";
import type { Recipe } from "./schema.ts";

export const dishQualityColorSchema = z.enum(["blue", "purple", "gold"]);
export type DishQualityColor = z.infer<typeof dishQualityColorSchema>;
export const dishQualityLabels: Record<DishQualityColor, string> = {
  blue: "蓝色品质",
  purple: "紫色品质",
  gold: "金色品质",
};
const backgroundLabels: Record<DishQualityColor, string> = {
  blue: "蓝灰色圆底",
  purple: "紫色圆底",
  gold: "橙金色圆底",
};
const text = z.string().min(1);
const observedQualityFields = {
  recipeId: text,
  color: dishQualityColorSchema,
  backgroundRaw: text,
  source: z.strictObject({
    guideId: text,
    row: z.number().int().positive(),
    nameRaw: text,
  }),
};

export const recipeQualitySchema = z
  .discriminatedUnion("status", [
    z.strictObject({ ...observedQualityFields, status: z.literal("recorded") }),
    z.strictObject({ ...observedQualityFields, status: z.literal("tentative"), reason: text }),
    z.strictObject({ recipeId: text, status: z.literal("unknown"), reason: text }),
  ])
  .superRefine((quality, context) => {
    const tableBackgroundLabels = {
      blue: "蓝色菜名单元格",
      purple: "紫色菜名单元格",
      gold: "金色菜名单元格",
    };
    if (
      quality.status !== "unknown" &&
      quality.backgroundRaw !== backgroundLabels[quality.color] &&
      quality.backgroundRaw !== tableBackgroundLabels[quality.color]
    ) {
      context.addIssue({ code: "custom", path: ["color"], message: "品质颜色与观察到的圆底不符" });
    }
  });
export type RecipeQuality = z.infer<typeof recipeQualitySchema>;

export const recipeQualityDatasetSchema = z
  .strictObject({
    checkedOn: z.iso.date(),
    interpretation: z.strictObject({
      id: text,
      kind: z.literal("user-confirmation"),
      confirmedOn: z.iso.date(),
      statementRaw: text,
      note: text,
    }),
    gameVerified: z.literal(false),
    guides: z.array(
      z.strictObject({
        id: text,
        author: text,
        section: z.enum(["简单菜", "招牌菜", "宴客菜"]),
        imageNumber: z.number().int().positive(),
        postUrl: z.url(),
        imageUrl: z.url(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/u),
        rowCount: z.number().int().positive(),
      }),
    ),
    recipes: z.array(recipeQualitySchema),
  })
  .superRefine((dataset, context) => {
    const guides = new Map(dataset.guides.map((guide) => [guide.id, guide]));
    if (guides.size !== dataset.guides.length) {
      context.addIssue({ code: "custom", path: ["guides"], message: "品质来源 ID 重复" });
    }
    const recipeIds = new Set<string>();
    const locations = new Set<string>();
    dataset.recipes.forEach((quality, index) => {
      const path = ["recipes", index];
      if (recipeIds.has(quality.recipeId)) {
        context.addIssue({ code: "custom", path, message: "菜品品质 ID 重复" });
      }
      recipeIds.add(quality.recipeId);
      if (quality.status === "unknown") return;
      const guide = guides.get(quality.source.guideId);
      if (!guide || quality.source.row > guide.rowCount) {
        context.addIssue({
          code: "custom",
          path: [...path, "source"],
          message: "品质来源缺失或行号越界",
        });
      }
      const location = `${quality.source.guideId}/${quality.source.row}`;
      if (locations.has(location)) {
        context.addIssue({
          code: "custom",
          path: [...path, "source"],
          message: "品质来源行被重复分配",
        });
      }
      locations.add(location);
    });
  });
export type RecipeQualityDataset = z.infer<typeof recipeQualityDatasetSchema>;

export function verifyRecipeQualityReferences(dataset: RecipeQualityDataset, recipes: Recipe[]) {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  if (dataset.recipes.length !== recipes.length) throw new Error("每道菜须有品质记录或未知原因");
  for (const quality of dataset.recipes) {
    const recipe = byId.get(quality.recipeId);
    if (!recipe) throw new Error(`品质引用菜谱不存在：${quality.recipeId}`);
    if (quality.status === "recorded" && quality.source.nameRaw !== recipe.name.raw) {
      throw new Error(`异名品质对应须保留 tentative 状态：${quality.recipeId}`);
    }
  }
}

// 品质来自独立的玩家图鉴观察及用户对颜色语义的说明，不回写附件转录。
export const recipeQualityDataset = recipeQualityDatasetSchema.parse(data);
verifyRecipeQualityReferences(recipeQualityDataset, recipeDataset.recipes);
export const recipeQualitiesById = new Map(
  recipeQualityDataset.recipes.map((quality) => [quality.recipeId, quality]),
);
export const qualityGuidesById = new Map(
  recipeQualityDataset.guides.map((guide) => [guide.id, guide]),
);

export function recipeQualityLabel(quality?: RecipeQuality) {
  if (!quality || quality.status === "unknown") return "品质待确认";
  return `${dishQualityLabels[quality.color]}${quality.status === "tentative" ? "（候选）" : ""}`;
}
