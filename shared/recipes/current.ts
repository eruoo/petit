import {
  primaryRecipeDataset,
  primaryRecipeSource,
  primaryRecipesById,
  supplementalRecipeDataset,
  supplementalRecipeSource,
  supplementalRecipesById,
  previousXiaomingRecipeDataset,
} from "./primary.ts";
import { recipeQualitySchema } from "./qualities.ts";
import type { RecipeQuality } from "./qualities.ts";
import { recipeSchema } from "./schema.ts";
import type { Recipe } from "./schema.ts";
import {
  applyRecipeDecision,
  recipeDecisions,
  recipeDecisionsById,
  usesSupplementalField,
} from "./decisions.ts";
import {
  applyReferenceSupplement,
  buildReferenceRecipes,
  referenceQuality,
  referenceSupplements,
  usesReferenceField,
} from "./references.ts";
import type { ReferenceField } from "./references.ts";

// 小铭 10/14 奇迹盛宴区没有力气列，该区力气由明天 9/29 补充。
export function usesSupplementalEnergy(primary: Recipe): boolean {
  return (
    primary.source.region === "miracle" &&
    primary.energy.status === "not-stated" &&
    supplementalRecipesById.has(primary.id)
  );
}

// 小铭保留原有顺序与等级；明天补充词条、概率与奇迹盛宴力气，并按用户决定采用差异字段。
export function resolveCurrentRecipe(primary: Recipe): Recipe {
  const supplemental = supplementalRecipesById.get(primary.id);
  return applyRecipeDecision(
    recipeSchema.parse({
      ...primary,
      tags: supplemental?.tags ?? primary.tags,
      productionChance: supplemental?.productionChance ?? primary.productionChance,
      energy: usesSupplementalEnergy(primary) ? supplemental!.energy : primary.energy,
    }),
  );
}

// 外部参考只在用户要求后填补两图仍为问号的字段，最后套用，不改写图片转录或用户采用结果。
export const currentRecipes = [
  ...primaryRecipeDataset.recipes.map(resolveCurrentRecipe),
  ...supplementalRecipeDataset.recipes.filter((recipe) => !primaryRecipesById.has(recipe.id)),
]
  .map((recipe) => applyReferenceSupplement(recipe))
  // 两图都没有的菜按用户要求整条补入，排在图片条目之后。
  .concat(buildReferenceRecipes());
export const currentRecipeSources = [primaryRecipeSource, supplementalRecipeSource];

// 逐字段引用让汇总视图仍可追溯，不将参考图字段冒充主体图记录。
export const currentRecipeFieldSourcesById = new Map(
  currentRecipes.map((recipe) => {
    const supplemental = supplementalRecipesById.get(recipe.id);
    const decision = recipeDecisionsById.get(recipe.id);
    const primary = primaryRecipesById.get(recipe.id);
    const fieldSource = (field: Parameters<typeof usesSupplementalField>[1]) => ({
      source: usesSupplementalField(recipe.id, field) ? supplemental!.source : recipe.source,
      userDecision: usesSupplementalField(recipe.id, field)
        ? { id: recipeDecisions.id, recipeId: recipe.id }
        : undefined,
    });
    const referenceFields = (
      ["recipe", "ingredients", "energy", "tags", "specialEffect", "quality"] as const
    ).filter((field: ReferenceField) => usesReferenceField(recipe.id, field));
    return [
      recipe.id,
      {
        recipe: recipe.source,
        tags: supplemental?.source ?? recipe.source,
        productionChance: supplemental?.source ?? recipe.source,
        ingredients: {
          ...fieldSource("ingredients"),
          ...(decision?.action === "confirm-ingredient"
            ? { userDecision: { id: recipeDecisions.id, recipeId: recipe.id } }
            : {}),
        },
        name: fieldSource("name"),
        cookingMethod: fieldSource("cookingMethod"),
        energy:
          primary && usesSupplementalEnergy(primary)
            ? { source: supplemental!.source, userDecision: undefined }
            : fieldSource("energy"),
        specialEffect: fieldSource("specialEffect"),
        effectTrigger: fieldSource("specialEffect"),
        acquisition: fieldSource("acquisition"),
        guideDetails: recipe.source,
        // 列出由外部参考补齐的字段；其余字段仍按上面的图片来源与用户决定读取。
        reference: referenceFields.length
          ? { id: referenceSupplements.id, recipeId: recipe.id, fields: referenceFields }
          : undefined,
      },
    ];
  }),
);

export function currentSourceRow(recipe: Recipe) {
  const source = currentRecipeFieldSourcesById.get(recipe.id)?.name.source ?? recipe.source;
  // 外部资料补入的条目没有图片行。
  if (![primaryRecipeSource.id, supplementalRecipeSource.id].includes(source.sourceId))
    return undefined;
  const dataset =
    source.sourceId === primaryRecipeSource.id ? primaryRecipeDataset : supplementalRecipeDataset;
  return dataset.inventory.regions
    .find((region) => region.id === source.region)
    ?.rows.find((row) => row.row === source.row);
}

const qualityLabels = { blue: "蓝", purple: "紫", gold: "金" };
export const currentRecipeQualitiesById = new Map<string, RecipeQuality>(
  currentRecipes.map((recipe) => {
    const primaryBackground = recipe.visualCues.find((cue) => cue.field === "name")?.background;
    const reference = supplementalRecipesById.get(recipe.id);
    const background =
      primaryBackground ?? reference?.visualCues.find((cue) => cue.field === "name")?.background;
    const sourceRecipe = primaryBackground
      ? (primaryRecipesById.get(recipe.id) ?? recipe)
      : reference;
    const color = background === "yellow" ? "gold" : background;
    const referenced = referenceQuality(recipe.id);
    if (referenced && color)
      throw new Error(`${recipe.name.raw}：已有图片底色，不能用参考品质覆盖`);
    const quality: RecipeQuality = referenced
      ? { recipeId: recipe.id, status: "referenced", ...referenced }
      : color && sourceRecipe
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
