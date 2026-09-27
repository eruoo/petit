import recipes from "../../data/recipes/xiaoming.json" with { type: "json" };
import inventory from "../../docs/references/recipes/xiaoming-09-27.inventory.json" with { type: "json" };
import { recipeDataset } from "./index.ts";
import { recipeDatasetSchema } from "./schema.ts";

export const primaryRecipeSource = recipeDataset.sources.find(
  (source) => source.id === "tomorrow-20260924-image",
)!;
export const primaryRecipeDataset = recipeDataset;
export const primaryRecipesById = new Map(
  primaryRecipeDataset.recipes.map((recipe) => [recipe.id, recipe]),
);

export const supplementalRecipeSource = recipeDataset.sources.find(
  (source) => source.id === "xiaoming-0927-image",
)!;

// 两份原始转录独立校验；采用顺序只影响 current.ts，不回写任何原文。
export const supplementalRecipeDataset = recipeDatasetSchema.parse({
  sources: [supplementalRecipeSource],
  inventory,
  recipes,
});
export const supplementalRecipesById = new Map(
  supplementalRecipeDataset.recipes.map((recipe) => [recipe.id, recipe]),
);
