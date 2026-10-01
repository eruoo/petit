import sources from "../../data/recipes/sources.json" with { type: "json" };
import recipes from "../../data/recipes/archive/2026-09-23.json" with { type: "json" };
import inventory from "../../docs/references/recipes/tomorrow-2026-09-23.inventory.json" with { type: "json" };
import { recipeDatasetSchema } from "./schema.ts";
import type { RecipeDataset } from "./schema.ts";

// 历史记录只由校验与测试读取，页面不载入整份旧版配方。
export const previousRecipeDataset = recipeDatasetSchema.parse({ sources, recipes, inventory });

export function verifyPreviousRecipeReferences(current: RecipeDataset, previous: RecipeDataset) {
  const previousById = new Map(previous.recipes.map((recipe) => [recipe.id, recipe]));
  const previousNames = new Set(
    previous.recipes.map((recipe) => `${recipe.source.region}/${recipe.name.raw}`),
  );
  const referenced = new Set<string>();
  for (const recipe of current.recipes) {
    const reference = recipe.previousRecipeId;
    if (!reference) {
      if (previousNames.has(`${recipe.source.region}/${recipe.name.raw}`)) {
        throw new Error(`${recipe.id}: 缺少旧版同名记录的引用`);
      }
      continue;
    }
    const prior = previousById.get(reference);
    if (!prior) throw new Error(`${recipe.id}: 旧版记录引用不存在：${reference}`);
    if (referenced.has(reference)) throw new Error(`${recipe.id}: 重复引用旧版记录：${reference}`);
    if (
      prior.name.raw !== recipe.name.raw ||
      prior.source.region !== recipe.source.region ||
      prior.source.sourceId === recipe.source.sourceId
    ) {
      throw new Error(`${recipe.id}: 新旧记录来源、分区或菜名对应不符`);
    }
    referenced.add(reference);
  }
}
