import recipes from "../../data/recipes/xiaoming-09-30.json" with { type: "json" };
import inventory from "../../docs/references/recipes/xiaoming-09-30.inventory.json" with { type: "json" };
import previousRecipes from "../../data/recipes/xiaoming.json" with { type: "json" };
import previousInventory from "../../docs/references/recipes/xiaoming-09-27.inventory.json" with { type: "json" };
import tomorrowRecipes from "../../data/recipes/tomorrow-09-29.json" with { type: "json" };
import tomorrowInventory from "../../docs/references/recipes/tomorrow-2026-09-29.inventory.json" with { type: "json" };
import { recipeDataset } from "./index.ts";
import { recipeDatasetSchema } from "./schema.ts";

export const primaryRecipeSource = recipeDataset.sources.find(
  (source) => source.id === "xiaoming-0930-image",
)!;
export const primaryRecipeDataset = recipeDatasetSchema.parse({
  sources: [primaryRecipeSource],
  inventory,
  recipes,
});
export const primaryRecipesById = new Map(
  primaryRecipeDataset.recipes.map((recipe) => [recipe.id, recipe]),
);

export const supplementalRecipeSource = recipeDataset.sources.find(
  (source) => source.id === "tomorrow-20260929-image",
)!;

// 历史转录独立校验；采用顺序只影响 current.ts，不回写任何原文。
export const supplementalRecipeDataset = recipeDatasetSchema.parse({
  sources: [supplementalRecipeSource],
  inventory: tomorrowInventory,
  recipes: tomorrowRecipes,
});
export const supplementalRecipesById = new Map(
  supplementalRecipeDataset.recipes.map((recipe) => [recipe.id, recipe]),
);
export const previousXiaomingRecipeDataset = recipeDatasetSchema.parse({
  sources: recipeDataset.sources.filter((source) => source.id === "xiaoming-0927-image"),
  inventory: previousInventory,
  recipes: previousRecipes,
});
