import { z } from "zod";
import data from "../../data/recipes/reference-supplements.json" with { type: "json" };
import {
  externalReferenceSourceSchema,
  ingredientQualityColorSchema,
  ingredientTermSchema,
  recipeSchema,
  recipeTagSchema,
} from "./schema.ts";
import type { Recipe } from "./schema.ts";

const text = z.string().min(1);
const sourceRaw = z.strictObject({ en: z.string(), zh: z.string() });
const qualityName = z.enum(["Uncommon", "Rare", "Stellar"]);

// 用户要求补齐时，外部玩家资料只填入原图问号的字段，不覆盖任何图片已写明的值。
export const referenceSupplementsSchema = z
  .strictObject({
    id: recipeSchema.shape.id,
    receivedOn: z.iso.date(),
    source: z.literal("user-message"),
    statementRaw: text,
    gameVerified: z.literal(false),
    sources: z
      .array(z.strictObject({ id: recipeSchema.shape.id, ...externalReferenceSourceSchema.shape }))
      .min(1),
    qualityInterpretation: z.strictObject({
      id: recipeSchema.shape.id,
      nameToColor: z.strictObject({
        Uncommon: z.literal("blue"),
        Rare: z.literal("purple"),
        Stellar: z.literal("gold"),
      }),
      basis: text,
    }),
    recipes: z.array(
      z.strictObject({
        recipeId: recipeSchema.shape.id,
        nameRaw: text,
        sourceIds: z.array(recipeSchema.shape.id).min(1),
        ingredients: z
          .array(
            z.strictObject({
              raw: text,
              value: ingredientTermSchema,
              quality: qualityName.optional(),
              sourceRaw,
            }),
          )
          .min(1)
          .optional(),
        energy: z
          .strictObject({ raw: text, value: z.number().int().positive(), sourceRaw })
          .optional(),
        tags: z
          .strictObject({ raw: text, value: z.array(recipeTagSchema).min(1), sourceRaw })
          .optional(),
        specialEffect: z
          .union([
            z.strictObject({
              raw: text,
              value: z.strictObject({
                name: text,
                tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
              }),
              sourceRaw,
            }),
            z.strictObject({ status: z.literal("not-stated"), reason: text, sourceRaw }),
          ])
          .optional(),
        notes: z.array(text),
      }),
    ),
  })
  .superRefine((dataset, context) => {
    const sourceIds = new Set(dataset.sources.map((source) => source.id));
    if (sourceIds.size !== dataset.sources.length)
      context.addIssue({ code: "custom", path: ["sources"], message: "参考资料 ID 重复" });
    const recipeIds = new Set<string>();
    dataset.recipes.forEach((entry, index) => {
      if (recipeIds.has(entry.recipeId))
        context.addIssue({ code: "custom", path: ["recipes", index], message: "补充菜谱重复" });
      recipeIds.add(entry.recipeId);
      if (entry.sourceIds.some((id) => !sourceIds.has(id)))
        context.addIssue({
          code: "custom",
          path: ["recipes", index],
          message: "补充引用的资料不存在",
        });
    });
  });
export type ReferenceSupplements = z.infer<typeof referenceSupplementsSchema>;
export const referenceSupplements = referenceSupplementsSchema.parse(data);
export const referenceSupplementsById = new Map(
  referenceSupplements.recipes.map((entry) => [entry.recipeId, entry]),
);
export type ReferenceField = "ingredients" | "energy" | "tags" | "specialEffect";

export function usesReferenceField(recipeId: string, field: ReferenceField): boolean {
  return referenceSupplementsById.get(recipeId)?.[field] !== undefined;
}

export function applyReferenceSupplement(recipe: Recipe, dataset = referenceSupplements): Recipe {
  const entry = dataset.recipes.find((candidate) => candidate.recipeId === recipe.id);
  if (!entry) return recipe;
  if (entry.nameRaw !== recipe.name.raw) throw new Error(`参考补充菜名不符：${entry.recipeId}`);
  const gap = (status: string, field: string) => {
    if (status !== "unknown")
      throw new Error(`${entry.nameRaw}：${field} 已有图片值，不能用参考资料覆盖`);
  };
  if (entry.ingredients) recipe.ingredients.forEach((slot) => gap(slot.selection.status, "食材"));
  if (entry.energy) gap(recipe.energy.status, "力气");
  if (entry.tags) gap(recipe.tags.status, "词条");
  if (entry.specialEffect) gap(recipe.specialEffect.status, "特殊效果");
  const { nameToColor, id: interpretationId } = dataset.qualityInterpretation;
  const effect = entry.specialEffect;
  return recipeSchema.parse({
    ...recipe,
    ingredients: entry.ingredients
      ? entry.ingredients.map((slot) => ({
          selection: { status: "recorded", raw: slot.raw, value: slot.value },
          quality: slot.quality
            ? {
                status: "interpreted",
                color: ingredientQualityColorSchema.parse(nameToColor[slot.quality]),
                interpretationId,
              }
            : { status: "not-stated", raw: "" },
        }))
      : recipe.ingredients,
    energy: entry.energy
      ? { status: "recorded", raw: entry.energy.raw, value: entry.energy.value }
      : recipe.energy,
    tags: entry.tags
      ? { status: "recorded", raw: entry.tags.raw, value: entry.tags.value }
      : recipe.tags,
    specialEffect: !effect
      ? recipe.specialEffect
      : "status" in effect
        ? { status: "not-stated", raw: "", reason: effect.reason }
        : { status: "recorded", raw: effect.raw, value: effect.value },
    // 原图问号槽位被整组替换，旧的槽位线索不能留在新槽位上。
    visualCues: entry.ingredients
      ? recipe.visualCues.filter((cue) => !cue.field.startsWith("ingredients."))
      : recipe.visualCues,
  });
}
