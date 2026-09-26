import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { recipeDataset } from "../shared/recipes/index.ts";
import { collectRecipeReviewItems } from "../shared/recipes/review.ts";
import type { RecipeSource } from "../shared/recipes/schema.ts";

export function verifySourceAssets(sources: RecipeSource[]) {
  const root = new URL("../", import.meta.url);
  for (const source of sources) {
    const { asset } = source;
    const bytes = readFileSync(new URL(asset.path, root));
    if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw new Error(`${source.id}: 原始附件不是 PNG`);
    }
    if (
      bytes.length !== asset.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== asset.sha256
    ) {
      throw new Error(`${source.id}: 原始附件大小或 SHA-256 不符`);
    }
    if (bytes.readUInt32BE(16) !== asset.width || bytes.readUInt32BE(20) !== asset.height) {
      throw new Error(`${source.id}: 原始附件尺寸不符`);
    }
  }
}

if (import.meta.main) {
  verifySourceAssets(recipeDataset.sources);
  for (const region of recipeDataset.inventory.regions) {
    const count = recipeDataset.recipes.filter(
      (recipe) => recipe.source.region === region.id,
    ).length;
    console.log(`${region.id}: ${count}/${region.expectedRows}`);
  }
  const reviewItems = collectRecipeReviewItems(recipeDataset.recipes);
  const counts = Object.fromEntries(
    ["tentative", "unknown", "unresolved", "review-note"].map((status) => [
      status,
      reviewItems.filter((item) => item.status === status).length,
    ]),
  );
  console.log(
    `菜谱与附件校验通过：${recipeDataset.recipes.length}/${recipeDataset.inventory.expectedTotal} 行。待核对字段：${JSON.stringify(counts)}`,
  );
  console.log("全部为玩家图片转录；游戏内验证：0。图片未说明的分类、品质、概率数值仍未说明。");
  if (process.argv.includes("--details")) {
    for (const item of reviewItems)
      console.log(
        `${item.region}/${item.row} ${item.field} [${item.status}] ${item.raw} ${item.reason}`,
      );
  }
}
