import {
  primaryRecipeDataset,
  primaryRecipeSource,
  supplementalRecipeDataset,
  supplementalRecipeSource,
  supplementalRecipesById,
  previousXiaomingRecipeDataset,
} from "./primary.ts";
import { recipeQualitySchema } from "./qualities.ts";
import type { RecipeQuality } from "./qualities.ts";
import { recipeSchema } from "./schema.ts";
import type { Recipe } from "./schema.ts";
import { applyRecipeDecision, recipeDecisions, recipeDecisionsById } from "./decisions.ts";

// 配方完整采用最新图；旧图只补未提供的词条、产出概率与菜名品质底色。
export function resolveCurrentRecipe(primary: Recipe): Recipe {
  const supplemental = supplementalRecipesById.get(primary.id);
  return applyRecipeDecision(
    recipeSchema.parse({
      ...primary,
      tags: supplemental?.tags ?? primary.tags,
      productionChance: supplemental?.productionChance ?? primary.productionChance,
    }),
  );
}

export const currentRecipes = primaryRecipeDataset.recipes.map(resolveCurrentRecipe);
export const currentRecipeSources = [primaryRecipeSource, supplementalRecipeSource];

// 逐字段引用让汇总视图仍可追溯，不将参考图字段冒充主体图记录。
export const currentRecipeFieldSourcesById = new Map(
  currentRecipes.map((recipe) => {
    const supplemental = supplementalRecipesById.get(recipe.id);
    const decision = recipeDecisionsById.get(recipe.id);
    return [
      recipe.id,
      {
        recipe: recipe.source,
        tags: supplemental?.source ?? recipe.source,
        productionChance: supplemental?.source ?? recipe.source,
        ingredients: {
          source: decision?.action === "use-ingredients" ? decision.source : recipe.source,
          userDecision: decision ? { id: recipeDecisions.id, recipeId: recipe.id } : undefined,
        },
        guideDetails: recipe.source,
      },
    ];
  }),
);

export function currentSourceRow(recipe: Recipe) {
  const dataset =
    recipe.source.sourceId === primaryRecipeSource.id
      ? primaryRecipeDataset
      : supplementalRecipeDataset;
  return dataset.inventory.regions
    .find((region) => region.id === recipe.source.region)
    ?.rows.find((row) => row.row === recipe.source.row);
}

const qualityLabels = { blue: "蓝", purple: "紫", gold: "金" };
export const currentRecipeQualitiesById = new Map<string, RecipeQuality>(
  currentRecipes.map((recipe) => {
    const primaryBackground = recipe.visualCues.find((cue) => cue.field === "name")?.background;
    const reference = supplementalRecipesById.get(recipe.id);
    const background =
      primaryBackground ?? reference?.visualCues.find((cue) => cue.field === "name")?.background;
    const sourceRecipe = primaryBackground ? recipe : reference;
    const color = background === "yellow" ? "gold" : background;
    const quality: RecipeQuality =
      color && sourceRecipe
        ? {
            recipeId: recipe.id,
            status: "recorded",
            color,
            backgroundRaw: `${qualityLabels[color]}色菜名单元格`,
            source: {
              guideId: sourceRecipe.source.sourceId,
              row: sourceRecipe.source.row,
              nameRaw: sourceRecipe.name.raw,
            },
          }
        : {
            recipeId: recipe.id,
            status: "unknown",
            reason: "主体图及参考图均未提供此菜的品质底色依据。",
          };
    return [recipe.id, recipeQualitySchema.parse(quality)];
  }),
);

export interface RecipeDifference {
  field: string;
  label: string;
  previous: string;
  current: string;
  kind: "wording" | "uncertainty" | "recipe" | "quality" | "effect";
}
const comparisonTerms: Record<string, string> = {
  水果类: "水果",
  蔬菜类: "蔬菜",
  鱼类: "鱼",
  谷物类: "谷物",
  虾类: "虾",
  贝类: "贝",
  蟹类: "蟹",
  螃蟹: "蟹",
  稻米: "水稻",
  淡水鱼: "河鱼",
};
function comparisonTerm(raw: string) {
  return raw
    .replace(/[?？]/gu, "")
    .split("/")
    .map((name) => comparisonTerms[name] ?? name)
    .join("/");
}
function sortedTerms(recipe: Recipe) {
  return recipe.ingredients
    .map((slot) => comparisonTerm(slot.selection.raw))
    .sort()
    .join("+");
}
function ingredientRequirements(recipe: Recipe) {
  return (
    recipe.ingredients
      .flatMap(({ selection, quality }, index) =>
        quality.status === "interpreted"
          ? [`第 ${index + 1} 项 ${comparisonTerm(selection.raw)}：${qualityLabels[quality.color]}`]
          : [],
      )
      .join("；") || "未标底色"
  );
}
export function getRecipeDifferences(recipeId: string): RecipeDifference[] {
  const previous = previousXiaomingRecipeDataset.recipes.find((recipe) => recipe.id === recipeId);
  const current = currentRecipes.find((recipe) => recipe.id === recipeId);
  if (!previous || !current) return [];
  const differences: RecipeDifference[] = [];
  const before = previous.ingredients.map((slot) => slot.selection.raw).join(" + ");
  const after = current.ingredients.map((slot) => slot.selection.raw).join(" + ");
  if (before !== after)
    differences.push({
      field: "ingredients",
      label: "食材原文与顺序",
      previous: before,
      current: after,
      kind:
        sortedTerms(previous) !== sortedTerms(current)
          ? "recipe"
          : /[?？]/u.test(before + after)
            ? "uncertainty"
            : "wording",
    });
  const oldQuality = ingredientRequirements(previous),
    newQuality = ingredientRequirements(current);
  if (oldQuality !== newQuality)
    differences.push({
      field: "ingredientQuality",
      label: "食材品质要求",
      previous: oldQuality,
      current: newQuality,
      kind: "quality",
    });
  for (const [field, label, kind] of [
    ["name", "菜名", "wording"],
    ["cookingMethod", "烹饪方式", "recipe"],
    ["energy", "增加力气", "recipe"],
    ["specialEffect", "增益名称与阶级", "effect"],
  ] as const) {
    if (previous[field].raw !== current[field].raw)
      differences.push({
        field,
        label,
        previous: previous[field].raw,
        current: current[field].raw,
        kind,
      });
  }
  return differences;
}
