import { z } from "zod";
import wiki from "../../docs/references/recipes/wiki-dish-icons-2026-09-26.json" with { type: "json" };
import wikiSupplement from "../../docs/references/recipes/wiki-dish-icons-2026-10-01.json" with { type: "json" };
import wikiOctober4 from "../../docs/references/recipes/wiki-dish-icons-2026-10-04.json" with { type: "json" };
import taptap from "../../docs/references/recipes/taptap-recipe-guides-2026-09-26.json" with { type: "json" };
import { recipeDataset } from "./index.ts";
import { currentRecipes } from "./current.ts";

export const imageStatusLabels = {
  "visual-candidate": "图形候选",
  "name-variant-visual-candidate": "异名待核对",
  "shared-art-candidate": "共用图形候选",
  "english-entry-candidate": "英文条目候选",
  "same-name-image-candidate": "同名攻略图候选",
} as const;

export const recipeImageSchema = z
  .object({
    recipeId: z.string().min(1),
    assetId: z.string().min(1),
    localPath: z.string().startsWith("docs/references/recipes/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    provider: z.enum(["wiki", "taptap"]),
    sourceLabel: z.string().min(1),
    sourceUrl: z.url(),
    sourceLocation: z.string().optional(),
    guideNameRaw: z.string().optional(),
    status: z.enum(
      Object.keys(imageStatusLabels) as [
        keyof typeof imageStatusLabels,
        ...Array<keyof typeof imageStatusLabels>,
      ],
    ),
    gameVerified: z.literal(false),
    notes: z.array(z.string()),
    displayRegion: z
      .object({
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
  })
  .superRefine((image, context) => {
    const region = image.displayRegion;
    if (image.provider === "taptap" && !region) {
      context.addIssue({
        code: "custom",
        path: ["displayRegion"],
        message: "攻略图须定位菜品区域",
      });
    }
    if (
      region &&
      (region.x + region.width > image.width || region.y + region.height > image.height)
    ) {
      context.addIssue({ code: "custom", path: ["displayRegion"], message: "显示区域超出原图" });
    }
  });

export type RecipeImage = z.infer<typeof recipeImageSchema>;

const wikiFileRecords = [...wiki.files, ...wikiSupplement.files, ...wikiOctober4.files];
const wikiFiles = new Map(wikiFileRecords.map((file) => [file.id, file]));
if (wikiFiles.size !== wikiFileRecords.length) throw new Error("Duplicate Wiki image file ID");
const wikiCandidates = [...wiki.recipes, ...wikiSupplement.recipes, ...wikiOctober4.recipes];
const wikiRecipeIds = new Set(
  wikiCandidates
    .filter((candidate) => candidate.candidateFileId)
    .map((candidate) => candidate.recipeId),
);

// 已核对清单是图片对应关系的唯一来源；配图资料不回写原始菜谱字段。
const candidateImages = z.array(recipeImageSchema).parse([
  ...wikiCandidates.flatMap((candidate) => {
    if (!candidate.candidateFileId) return [];
    const file = wikiFiles.get(candidate.candidateFileId);
    if (!file) throw new Error(`Missing image file: ${candidate.candidateFileId}`);
    return [
      {
        recipeId: candidate.recipeId,
        assetId: file.id,
        localPath: file.localPath,
        width: file.width,
        height: file.height,
        provider: "wiki",
        sourceLabel: "Petit Planet Wiki",
        sourceUrl: file.filePageUrl,
        guideNameRaw: "guide" in candidate.evidence ? candidate.evidence.guide?.nameRaw : undefined,
        status: candidate.status,
        gameVerified: candidate.gameVerified,
        notes: candidate.notes,
      },
    ];
  }),
  ...taptap.files.flatMap((file) =>
    // 已核对的 Wiki 独立图优先，旧攻略候选与原文件继续保留归档。
    file.targetRecipes
      .filter((target) => !wikiRecipeIds.has(target.recipeId))
      .map((target) => ({
        recipeId: target.recipeId,
        assetId: file.id,
        localPath: file.localPath,
        width: file.width,
        height: file.height,
        provider: "taptap",
        sourceLabel: `TapTap · ${file.author}`,
        sourceUrl: file.postUrl,
        sourceLocation: `${file.guideSection}第 ${file.imageNumber} 张 · 第 ${target.row} 行`,
        guideNameRaw: target.guideNameRaw,
        status: target.status,
        gameVerified: target.gameVerified,
        notes: ["显示完整攻略图中的菜品区域；原图与作者署名保留，可打开核对。"],
        displayRegion: target.displayRegion,
      })),
  ),
]);

// 既有候选经记录延续关系迁移；新增候选直接引用当前 ID，不按新行号配图。
const candidateImagesById = new Map(candidateImages.map((image) => [image.recipeId, image]));
if (candidateImagesById.size !== candidateImages.length)
  throw new Error("Duplicate recipe image candidate mapping");
const previousRecipeIds = new Map(
  recipeDataset.recipes.map((recipe) => [recipe.id, recipe.previousRecipeId ?? recipe.id]),
);
export const recipeImages = currentRecipes.flatMap((recipe) => {
  const image =
    candidateImagesById.get(recipe.id) ??
    candidateImagesById.get(previousRecipeIds.get(recipe.id) ?? recipe.id);
  return image ? [{ ...image, recipeId: recipe.id }] : [];
});

export const recipeImagesById = new Map(recipeImages.map((image) => [image.recipeId, image]));
if (recipeImagesById.size !== recipeImages.length)
  throw new Error("Duplicate recipe image mapping");
