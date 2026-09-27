import { z } from "zod";
import data from "../../data/recipes/effect-evidence.json" with { type: "json" };
import { energySchema, sourceSchema } from "./schema.ts";
import type { Recipe } from "./schema.ts";
import { currentRecipes } from "./current.ts";

const text = z.string().min(1);
const tier = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const effectName = z.enum(["大力敲伐", "大力播洒", "快速翻土", "钓鱼之力", "轻盈潜行"]);
export const effectLimitSchema = z.strictObject({
  unit: z.enum(["seconds", "uses"]),
  value: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export type EffectLimit = z.infer<typeof effectLimitSchema>;
export const effectEvidenceSchema = z
  .strictObject({
    checkedOn: z.iso.date(),
    screenshots: z
      .array(
        z
          .strictObject({
            id: text,
            recipeId: text,
            receivedOn: z.iso.date(),
            capturedOn: z.iso.date().nullable(),
            gameVersion: text.nullable(),
            asset: sourceSchema.shape.asset,
            nameRaw: text,
            quality: z.enum(["blue", "purple", "gold"]),
            energy: energySchema,
            acquisitionRaw: z.literal("可能获得"),
            effectRaw: text,
            effectName,
            tier,
            descriptionRaw: text,
            descriptionComplete: z.boolean(),
            limit: z.discriminatedUnion("status", [
              z.strictObject({
                status: z.literal("recorded"),
                ...effectLimitSchema.shape,
                raw: text,
              }),
              z.strictObject({ status: z.literal("obscured"), reason: text }),
            ]),
          })
          .superRefine((shot, context) => {
            if (shot.effectRaw !== `${shot.effectName} ${["", "一阶", "二阶", "三阶"][shot.tier]}`)
              context.addIssue({
                code: "custom",
                path: ["effectRaw"],
                message: "截图效果与原文不符",
              });
            if (shot.limit.status === "recorded") {
              const expected =
                shot.limit.unit === "uses"
                  ? `${shot.limit.value}次内有效。`
                  : `生效时长：${shot.limit.value}秒。`;
              if (
                shot.limit.raw !== expected ||
                (shot.effectName === "大力敲伐") !== (shot.limit.unit === "uses")
              )
                context.addIssue({
                  code: "custom",
                  path: ["limit"],
                  message: "截图有效量与原文或单位不符",
                });
            }
          }),
      )
      .min(1),
    confirmations: z.array(
      z.strictObject({
        id: text,
        receivedOn: z.iso.date(),
        statementRaw: text,
        recipeId: text,
        effectName,
        tier,
        limit: effectLimitSchema,
      }),
    ),
  })
  .superRefine((dataset, context) => {
    const ids = new Set<string>();
    for (const item of [...dataset.screenshots, ...dataset.confirmations]) {
      if (ids.has(item.id))
        context.addIssue({ code: "custom", message: `增益证据 ID 重复：${item.id}` });
      ids.add(item.id);
      if (
        (item.effectName === "大力敲伐") !== ("unit" in item.limit && item.limit.unit === "uses") &&
        !("status" in item.limit && item.limit.status === "obscured")
      )
        context.addIssue({ code: "custom", message: `增益单位不符：${item.id}` });
    }
  });
export type EffectEvidenceDataset = z.infer<typeof effectEvidenceSchema>;
export function verifyEffectEvidenceReferences(evidence: EffectEvidenceDataset, recipes: Recipe[]) {
  const ids = new Set(recipes.map((recipe) => recipe.id));
  for (const item of [...evidence.screenshots, ...evidence.confirmations]) {
    if (!ids.has(item.recipeId)) throw new Error(`增益证据引用不存在：${item.recipeId}`);
  }
}
export const gameEffectEvidence = effectEvidenceSchema.parse(data);
verifyEffectEvidenceReferences(gameEffectEvidence, currentRecipes);

// 明天图的“播撒”与同菜同阶游戏截图的“播洒”对应；只用于关联证据，不改写原文。
function evidenceEffectName(name: string) {
  return name === "大力播撒" ? "大力播洒" : name;
}

// 只按当前效果名称和阶级关联独立游戏证据，不按旧菜品 ID 套用旧阶级时长。
export function getEffectEvidence(recipe: Recipe, dataset = gameEffectEvidence) {
  if (recipe.specialEffect.status !== "recorded") return undefined;
  const { name, tier } = recipe.specialEffect.value;
  const evidenceName = evidenceEffectName(name);
  const screenshots = dataset.screenshots.filter(
    (shot) => shot.effectName === evidenceName && shot.tier === tier,
  );
  const confirmations = dataset.confirmations.filter(
    (entry) => entry.effectName === evidenceName && entry.tier === tier,
  );
  const description =
    screenshots.find((shot) => shot.descriptionComplete) ??
    dataset.screenshots.find(
      (shot) => shot.effectName === evidenceName && shot.descriptionComplete,
    );
  const candidates = [
    ...screenshots.flatMap((shot) =>
      shot.limit.status === "recorded"
        ? [{ id: shot.id, unit: shot.limit.unit, value: shot.limit.value }]
        : [],
    ),
    ...confirmations.map((entry) => ({ id: entry.id, ...entry.limit })),
  ];
  const distinct = new Set(candidates.map((entry) => `${entry.unit}:${entry.value}`));
  const first = candidates[0];
  const limit: EffectLimit | undefined =
    distinct.size === 1 && first ? { unit: first.unit, value: first.value } : undefined;
  return {
    name,
    tier,
    description,
    screenshots,
    confirmations,
    limit,
    limitEvidenceIds: candidates.map((entry) => entry.id),
    limitConflict: distinct.size > 1,
    sameTierDescription: description?.tier === tier,
  };
}

export function collectCurrentEvidenceConflicts(recipes: Recipe[], dataset = gameEffectEvidence) {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const conflicts: string[] = [];
  for (const shot of dataset.screenshots) {
    const recipe = byId.get(shot.recipeId);
    if (!recipe) continue;
    if (
      recipe.specialEffect.status === "recorded" &&
      (evidenceEffectName(recipe.specialEffect.value.name) !== shot.effectName ||
        recipe.specialEffect.value.tier !== shot.tier)
    )
      conflicts.push(`${recipe.name.raw}：主体图与游戏截图的效果或阶级不同。`);
    if (
      recipe.energy.status === "recorded" &&
      shot.energy.status === "recorded" &&
      recipe.energy.value !== shot.energy.value
    )
      conflicts.push(`${recipe.name.raw}：主体图与游戏截图的力气不同。`);
  }
  for (const recipe of recipes) {
    if (getEffectEvidence(recipe, dataset)?.limitConflict)
      conflicts.push(`${recipe.name.raw}：同名同阶增益的独立有效量证据冲突，未选取数值。`);
  }
  return conflicts;
}
