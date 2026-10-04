import { z } from "zod";
import data from "../../data/recipes/user-decisions.json" with { type: "json" };
import { primaryRecipesById, supplementalRecipesById } from "./primary.ts";
import { recipeSchema } from "./schema.ts";
import type { Recipe } from "./schema.ts";

const text = z.string().min(1);
const identity = { recipeId: recipeSchema.shape.id, nameRaw: text };
const adoptedFieldSchema = z.enum([
  "name",
  "ingredients",
  "cookingMethod",
  "energy",
  "specialEffect",
  "acquisition",
]);
type AdoptedField = z.infer<typeof adoptedFieldSchema>;
export const recipeDecisionsSchema = z
  .strictObject({
    id: recipeSchema.shape.id,
    receivedOn: z.iso.date(),
    source: z.literal("user-message"),
    statementRaw: text,
    gameVerified: z.literal(false),
    decisions: z
      .array(
        z.discriminatedUnion("action", [
          z.strictObject({
            ...identity,
            action: z.literal("confirm-ingredient"),
            slot: z.number().int().nonnegative(),
            previousRaw: text,
            raw: text,
          }),
          z.strictObject({
            ...identity,
            action: z.literal("use-ingredients"),
            source: recipeSchema.shape.source,
          }),
          z.strictObject({
            ...identity,
            action: z.literal("use-fields"),
            fields: z
              .array(adoptedFieldSchema)
              .min(1)
              .refine((fields) => new Set(fields).size === fields.length, "采用字段不能重复"),
            source: recipeSchema.shape.source,
          }),
          z.strictObject({ ...identity, action: z.literal("keep-primary"), reason: text }),
        ]),
      )
      .min(1),
  })
  .superRefine((dataset, context) => {
    const ids = new Set<string>();
    for (const [index, decision] of dataset.decisions.entries()) {
      const primary = primaryRecipesById.get(decision.recipeId);
      let valid = Boolean(primary && primary.name.raw === decision.nameRaw);
      if (ids.has(decision.recipeId)) valid = false;
      ids.add(decision.recipeId);
      if (decision.action === "confirm-ingredient") {
        const selection = primary?.ingredients[decision.slot]?.selection;
        // 只确认指定槽位原有候选，不把未知项或别的食材静默改成确定值。
        valid &&=
          selection?.status === "tentative" &&
          selection.raw === decision.previousRaw &&
          selection.candidate.kind !== "any-of" &&
          selection.candidate.name === decision.raw &&
          !/[?？()（）]/u.test(decision.raw);
      } else if (decision.action === "use-ingredients" || decision.action === "use-fields") {
        const recipe = supplementalRecipesById.get(decision.recipeId);
        valid &&=
          recipe?.source.sourceId === decision.source.sourceId &&
          recipe.source.region === decision.source.region &&
          recipe.source.row === decision.source.row;
        if (decision.action === "use-fields" && decision.fields.includes("acquisition"))
          valid &&= Boolean(recipe?.guideDetails?.acquisitionRaw);
      }
      if (!valid)
        context.addIssue({
          code: "custom",
          path: ["decisions", index],
          message: "用户决定重复，或菜谱、槽位、原文、来源引用不符",
        });
    }
  });
export type RecipeDecisions = z.infer<typeof recipeDecisionsSchema>;
export const recipeDecisions = recipeDecisionsSchema.parse(data);
export const recipeDecisionsById = new Map(
  recipeDecisions.decisions.map((entry) => [entry.recipeId, entry]),
);

export function usesSupplementalField(recipeId: string, field: AdoptedField): boolean {
  const decision = recipeDecisionsById.get(recipeId);
  return decision?.action === "use-fields"
    ? decision.fields.includes(field)
    : decision?.action === "use-ingredients" && field === "ingredients";
}

export function applyRecipeDecision(recipe: Recipe): Recipe {
  const decision = recipeDecisionsById.get(recipe.id);
  if (!decision || decision.action === "keep-primary") return recipe;
  if (decision.action === "use-ingredients" || decision.action === "use-fields") {
    const selected = supplementalRecipesById.get(recipe.id)!;
    const adopts = (field: AdoptedField) => usesSupplementalField(recipe.id, field);
    const replacedFields: readonly string[] =
      decision.action === "use-ingredients" ? ["ingredients"] : decision.fields;
    return recipeSchema.parse({
      ...recipe,
      name: adopts("name") ? selected.name : recipe.name,
      ingredients: adopts("ingredients") ? selected.ingredients : recipe.ingredients,
      cookingMethod: adopts("cookingMethod") ? selected.cookingMethod : recipe.cookingMethod,
      energy: adopts("energy") ? selected.energy : recipe.energy,
      specialEffect: adopts("specialEffect") ? selected.specialEffect : recipe.specialEffect,
      effectTrigger: adopts("specialEffect") ? selected.effectTrigger : recipe.effectTrigger,
      reviewNotes: [
        ...recipe.reviewNotes.filter(
          (note) => !note.field.split("/").every((field) => replacedFields.includes(field)),
        ),
        ...selected.reviewNotes.filter((note) =>
          note.field.split("/").some((field) => replacedFields.includes(field)),
        ),
      ],
      guideDetails: recipe.guideDetails && {
        ...recipe.guideDetails,
        acquisitionRaw: adopts("acquisition")
          ? selected.guideDetails!.acquisitionRaw
          : recipe.guideDetails.acquisitionRaw,
        groupedIngredients: adopts("ingredients")
          ? (selected.guideDetails?.groupedIngredients ?? [])
          : recipe.guideDetails.groupedIngredients,
      },
      // 品质和加粗随同一来源的有序食材一起读取，不能留在旧槽位上。
      visualCues: adopts("ingredients")
        ? [
            ...recipe.visualCues.filter((cue) => cue.field === "name"),
            ...selected.visualCues.filter((cue) => cue.field.startsWith("ingredients.")),
          ]
        : recipe.visualCues,
    });
  }
  return recipeSchema.parse({
    ...recipe,
    ingredients: recipe.ingredients.map((slot, index) =>
      index === decision.slot && slot.selection.status === "tentative"
        ? {
            ...slot,
            selection: { status: "recorded", raw: decision.raw, value: slot.selection.candidate },
          }
        : slot,
    ),
  });
}
