import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { recipeDataset } from "../shared/recipes/index.ts";
import { collectRecipeReviewItems } from "../shared/recipes/review.ts";
import {
  previousRecipeDataset,
  verifyPreviousRecipeReferences,
} from "../shared/recipes/history.ts";
import type { RecipeSource } from "../shared/recipes/schema.ts";
import { recipeQualityDataset } from "../shared/recipes/qualities.ts";
import {
  currentRecipes,
  currentRecipeQualitiesById,
  getRecipeDifferences,
} from "../shared/recipes/current.ts";
import { primaryRecipeDataset, supplementalRecipeDataset } from "../shared/recipes/primary.ts";
import { gameEffectEvidence, collectCurrentEvidenceConflicts } from "../shared/recipes/effects.ts";
import { recipeDecisions } from "../shared/recipes/decisions.ts";

function readImageDimensions(bytes: Buffer, mimeType: RecipeSource["asset"]["mimeType"]) {
  if (mimeType === "image/png") {
    if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw new Error("原始附件不是 PNG");
    }
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length < 4 || bytes.readUInt16BE(0) !== 0xffd8) {
    throw new Error("原始附件不是 JPEG");
  }
  // JPEG 的尺寸位于 SOF 帧头；按段长度跳过元数据，不扫描压缩像素中的相似字节。
  const frameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;
  while (offset < bytes.length && bytes[offset] === 0xff) {
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === undefined || marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (frameMarkers.has(marker)) {
      if (length < 8) break;
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error("原始 JPEG 附件缺少有效尺寸帧头");
}

export function verifySourceAssets(sources: Pick<RecipeSource, "id" | "asset">[]) {
  const root = new URL("../", import.meta.url);
  for (const source of sources) {
    const { asset } = source;
    const bytes = readFileSync(new URL(asset.path, root));
    const dimensions = readImageDimensions(bytes, asset.mimeType);
    if (
      bytes.length !== asset.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== asset.sha256
    ) {
      throw new Error(`${source.id}: 原始附件大小或 SHA-256 不符`);
    }
    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      throw new Error(`${source.id}: 原始附件尺寸不符`);
    }
  }
}

if (import.meta.main) {
  verifySourceAssets(recipeDataset.sources);
  verifySourceAssets(gameEffectEvidence.screenshots);
  verifyPreviousRecipeReferences(recipeDataset, previousRecipeDataset);
  console.log(
    `来源附件校验通过；当前主体：${primaryRecipeDataset.inventory.sourceId}；补充：${supplementalRecipeDataset.inventory.sourceId}。`,
  );
  for (const region of primaryRecipeDataset.inventory.regions) {
    const count = primaryRecipeDataset.recipes.filter(
      (recipe) => recipe.source.region === region.id,
    ).length;
    console.log(`${region.id}: ${count}/${region.expectedRows}`);
  }
  const reviewItems = collectRecipeReviewItems(currentRecipes);
  const counts = Object.fromEntries(
    ["tentative", "unknown", "unresolved", "review-note"].map((status) => [
      status,
      reviewItems.filter((item) => item.status === status).length,
    ]),
  );
  console.log(
    `主体 ${primaryRecipeDataset.recipes.length}/${primaryRecipeDataset.inventory.expectedTotal} 行、补充 ${supplementalRecipeDataset.recipes.length}/${supplementalRecipeDataset.inventory.expectedTotal} 行独立校验通过。当前待核对字段：${JSON.stringify(counts)}`,
  );
  console.log(`旧版快照与跨版本引用校验通过：${previousRecipeDataset.recipes.length} 条历史记录。`);
  console.log(
    `用户逐项决定及原文、来源引用校验通过：${recipeDecisions.decisions.length} 条；不代表游戏实测。`,
  );
  const qualityCounts = Object.fromEntries(
    ["blue", "purple", "gold", "unknown"].map((color) => [
      color,
      recipeQualityDataset.recipes.filter((quality) =>
        quality.status === "unknown" ? color === "unknown" : quality.color === color,
      ).length,
    ]),
  );
  console.log(`历史 TapTap 品质资料与引用校验通过：${JSON.stringify(qualityCounts)}。`);
  const currentQualityCounts = Object.fromEntries(
    ["blue", "purple", "gold", "unknown"].map((color) => [
      color,
      [...currentRecipeQualitiesById.values()].filter((quality) =>
        quality.status === "unknown" ? color === "unknown" : quality.color === color,
      ).length,
    ]),
  );
  console.log(`当前主体／参考菜品品质校验通过：${JSON.stringify(currentQualityCounts)}。`);
  const ingredientQualities = currentRecipes.flatMap((recipe) =>
    recipe.ingredients.map((slot) => slot.quality),
  );
  const ingredientQualityCounts = Object.fromEntries(
    ["blue", "purple", "gold", "not-stated"].map((color) => [
      color,
      ingredientQualities.filter((quality) =>
        quality.status === "interpreted" ? quality.color === color : quality.status === color,
      ).length,
    ]),
  );
  console.log(`食材品质底色与用户解释引用校验通过：${JSON.stringify(ingredientQualityCounts)}。`);
  console.log(
    `当前 ${currentRecipes.length} 道：明天主体 ${primaryRecipeDataset.recipes.length} 道、小铭新增 ${currentRecipes.filter((recipe) => recipe.source.sourceId === supplementalRecipeDataset.inventory.sourceId).length} 道；独立游戏截图 ${gameEffectEvidence.screenshots.length} 张、用户文字确认 ${gameEffectEvidence.confirmations.length} 条。`,
  );
  const conflicts = collectCurrentEvidenceConflicts(currentRecipes);
  console.log(
    `主体图与已录入截图／文字补充的力气、效果冲突：${conflicts.length}；来源差异单独保留，不声明游戏实测。`,
  );
  for (const conflict of conflicts) console.log(`待核对：${conflict}`);
  console.log(
    "原始转录与补充资料分别校验；图文核对不等于游戏实测。未标底色的品质、未列出的效果阶级与概率数值不推算。",
  );
  if (process.argv.includes("--details")) {
    for (const item of reviewItems)
      console.log(
        `${item.region}/${item.row} ${item.field} [${item.status}] ${item.raw} ${item.reason}`,
      );
    for (const recipe of currentRecipes)
      for (const difference of getRecipeDifferences(recipe.id))
        console.log(
          `${recipe.name.raw} ${difference.label} [${difference.kind}] 小铭 9/27：${difference.previous} → 当前网站：${difference.current}`,
        );
  }
}
