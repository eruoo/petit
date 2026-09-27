import { z } from "zod";
import data from "../../data/recipes/user-decisions.json" with { type: "json" };
import { primaryRecipesById, supplementalRecipesById } from "./primary.ts";
import { recipeSchema } from "./schema.ts";
import type { Recipe } from "./schema.ts";

const text = z.string().min(1);
const identity = { recipeId: recipeSchema.shape.id, nameRaw: text };
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
      } else if (decision.action === "use-ingredients") {
        const recipe = supplementalRecipesById.get(decision.recipeId);
        valid &&=
          recipe?.source.sourceId === decision.source.sourceId &&
          recipe.source.region === decision.source.region &&
          recipe.source.row === decision.source.row;
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

export function applyRecipeDecision(recipe: Recipe): Recipe {
  const decision = recipeDecisionsById.get(recipe.id);
  if (!decision || decision.action === "keep-primary") return recipe;
  if (decision.action === "use-ingredients") {
    const selected = supplementalRecipesById.get(recipe.id)!;
    return recipeSchema.parse({
      ...recipe,
      ingredients: selected.ingredients,
      // 品质和加粗随同一来源的有序食材一起读取，不能留在旧槽位上。
      visualCues: [
        ...recipe.visualCues.filter((cue) => cue.field === "name"),
        ...selected.visualCues.filter((cue) => cue.field.startsWith("ingredients.")),
      ],
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
