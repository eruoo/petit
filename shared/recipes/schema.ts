import { z } from "zod";

const text = z.string().min(1);
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const nonnegativeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

// recorded 只表示图片写明，不表示已经在游戏中验证。
function observation<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion("status", [
    z.strictObject({
      status: z.literal("recorded"),
      raw: text.refine((raw) => !/[?？]/u.test(raw) && raw !== "/", "疑问或斜杠不能成为确定值"),
      value,
    }),
    z.strictObject({ status: z.literal("tentative"), raw: text, candidate: value, reason: text }),
    z.strictObject({ status: z.literal("unknown"), raw: z.string(), reason: text }),
    z.strictObject({
      status: z.literal("not-stated"),
      raw: z.literal(""),
      reason: text.optional(),
    }),
    z.strictObject({
      status: z.literal("none"),
      raw: text.refine((raw) => raw !== "/" && !/[?？]/u.test(raw), "斜杠或问号不能表示明确不存在"),
      reason: text,
    }),
    z.strictObject({ status: z.literal("unresolved"), raw: z.string(), reason: text }),
  ]);
}

export const imageRegionSchema = z.enum(["simple", "signature", "guest", "free", "neighbor"]);
const boundsSchema = z.tuple([
  nonnegativeInteger,
  nonnegativeInteger,
  z.number().int().positive(),
  z.number().int().positive(),
]);
const ingredientTermSchema = z.strictObject({
  kind: z.enum(["item", "category", "unspecified"]),
  name: text,
});
const ingredientSelectionSchema = z.union([
  ingredientTermSchema,
  z.strictObject({ kind: z.literal("any-of"), options: z.array(ingredientTermSchema).min(2) }),
]);

export const ingredientSlotSchema = z.strictObject({
  selection: observation(ingredientSelectionSchema),
  quality: observation(text),
});

export const energySchema = observation(nonnegativeInteger).superRefine((energy, context) => {
  if (
    energy.status === "recorded" &&
    (!/^\d+$/u.test(energy.raw) || Number(energy.raw) !== energy.value)
  ) {
    context.addIssue({ code: "custom", message: "力气数值必须与图片数字原文一致" });
  }
});

// 当前图片没有百分比。严格对象拒绝附加 percent/rate 等伪造数字。
const effectTriggerSchema = z.union([
  z.strictObject({ status: z.literal("not-stated"), raw: z.literal("") }),
  z.strictObject({
    status: z.literal("unspecified-probability"),
    raw: z.literal("概率"),
    basis: z.literal("effect-column-heading"),
  }),
]);
const productionChanceSchema = z.union([
  z.strictObject({ status: z.literal("not-stated"), raw: z.literal("") }),
  z.strictObject({
    status: z.literal("unspecified-probability"),
    raw: z.literal("概率出"),
    basis: z.literal("effect-column-cell"),
  }),
]);

export const recipeSchema = z
  .strictObject({
    id,
    source: z.strictObject({
      sourceId: id,
      region: imageRegionSchema,
      row: z.number().int().positive(),
    }),
    verification: z.literal("image-transcribed-game-unverified"),
    name: observation(text),
    dishCategory: observation(text),
    ingredients: z.array(ingredientSlotSchema).min(1),
    cookingMethod: observation(z.enum(["煮锅", "榨汁机", "烤箱"])),
    energy: energySchema,
    tags: observation(
      z
        .array(
          z.enum([
            "饮品",
            "素菜",
            "荤菜",
            "荤素菜",
            "汤羹",
            "主食",
            "炒菜",
            "炖菜",
            "炸物",
            "甜点",
            "烧烤",
            "主菜",
          ]),
        )
        .min(1),
    ),
    specialEffect: observation(
      z.strictObject({ name: text, tier: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
    ),
    effectTrigger: effectTriggerSchema,
    productionChance: productionChanceSchema,
    visualCues: z.array(
      z
        .strictObject({
          field: z.string().regex(/^(name|ingredients\.\d+)$/),
          background: z.enum(["blue", "purple", "yellow"]).optional(),
          bold: z.literal(true).optional(),
        })
        .refine((cue) => cue.background !== undefined || cue.bold === true, "视觉线索不能为空"),
    ),
    noteIds: z.array(id),
    reviewNotes: z.array(z.strictObject({ field: text, reason: text })),
  })
  .superRefine((recipe, context) => {
    if (recipe.specialEffect.status === "recorded") {
      const effect = recipe.specialEffect;
      const tierRaw = ["", "一阶", "二阶", "三阶"][effect.value.tier];
      if (effect.raw.replace(/\s/gu, "") !== `${effect.value.name}${tierRaw}`) {
        context.addIssue({
          code: "custom",
          path: ["specialEffect"],
          message: "效果名称或阶级与原文不符",
        });
      }
    }
    if (
      recipe.productionChance.status === "unspecified-probability" &&
      recipe.source.region !== "free"
    ) {
      context.addIssue({
        code: "custom",
        path: ["productionChance"],
        message: "当前图片仅自由烹饪记录概率出",
      });
    }
    if (
      recipe.effectTrigger.status === "unspecified-probability" &&
      recipe.specialEffect.status !== "recorded"
    ) {
      context.addIssue({
        code: "custom",
        path: ["effectTrigger"],
        message: "效果触发概率须关联已转录的特殊效果",
      });
    }
    if (recipe.source.region === "free" && recipe.effectTrigger.status !== "not-stated") {
      context.addIssue({
        code: "custom",
        path: ["effectTrigger"],
        message: "自由烹饪的概率出不是效果触发概率",
      });
    }
    for (const [index, cue] of recipe.visualCues.entries()) {
      if (
        cue.field.startsWith("ingredients.") &&
        Number(cue.field.split(".")[1]) >= recipe.ingredients.length
      ) {
        context.addIssue({
          code: "custom",
          path: ["visualCues", index],
          message: "视觉线索指向不存在的食材槽位",
        });
      }
    }
  });

export const sourceSchema = z.strictObject({
  id,
  titleRaw: text,
  creator: text,
  imageDate: z.strictObject({ raw: text, value: z.iso.date() }),
  origin: z.strictObject({
    kind: z.literal("user-provided-image"),
    label: z.literal("用户提供图片"),
    originalPostUrl: observation(z.url()),
  }),
  publishedAt: observation(z.iso.date()),
  gameVersion: observation(text),
  asset: z.strictObject({
    path: z.string().regex(/^docs\/references\/recipes\/[a-z0-9-]+\.png$/),
    originalFilename: text,
    mimeType: z.literal("image/png"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    bytes: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  evidence: z.literal("player-record"),
  visualLegend: observation(text),
  notes: z.array(
    z.strictObject({
      id,
      raw: text,
      bounds: boundsSchema,
      appliesTo: z.array(imageRegionSchema).min(1),
      evidence: z.literal("player-record"),
    }),
  ),
});

export const inventorySchema = z.strictObject({
  sourceId: id,
  countingMethod: text,
  expectedTotal: z.number().int().positive(),
  regions: z
    .array(
      z.strictObject({
        id: imageRegionSchema,
        headingRaw: text,
        columnsRaw: z.array(text).min(1),
        expectedRows: z.number().int().positive(),
        headerBounds: boundsSchema,
        rows: z
          .array(
            z.strictObject({
              row: z.number().int().positive(),
              nameRaw: text,
              bounds: boundsSchema,
            }),
          )
          .min(1),
      }),
    )
    .length(5),
});

export const recipeDatasetSchema = z
  .strictObject({
    sources: z.array(sourceSchema).min(1),
    inventory: inventorySchema,
    recipes: z.array(recipeSchema).min(1),
  })
  .superRefine(({ sources, inventory, recipes }, context) => {
    const issue = (path: (string | number)[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    function unique(values: string[], path: (string | number)[]) {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (seen.has(value)) issue([...path, index], `重复 ID / 引用：${value}`);
        seen.add(value);
      });
    }
    unique(
      sources.map((source) => source.id),
      ["sources"],
    );
    unique(
      recipes.map((recipe) => recipe.id),
      ["recipes"],
    );
    unique(
      inventory.regions.map((region) => region.id),
      ["inventory", "regions"],
    );
    const source = sources.find((entry) => entry.id === inventory.sourceId);
    if (!source) issue(["inventory", "sourceId"], "清点表引用的来源不存在");
    function checkBounds(
      bounds: z.infer<typeof boundsSchema>,
      path: (string | number)[],
      asset: z.infer<typeof sourceSchema>["asset"],
    ) {
      const [x, y, width, height] = bounds;
      if (x + width > asset.width || y + height > asset.height) issue(path, "定位矩形超出原图尺寸");
    }
    for (const [index, entry] of sources.entries()) {
      unique(
        entry.notes.map((note) => note.id),
        ["sources", index, "notes"],
      );
      entry.notes.forEach((note, noteIndex) =>
        checkBounds(note.bounds, ["sources", index, "notes", noteIndex, "bounds"], entry.asset),
      );
    }
    const rowKeys = new Set<string>();
    for (const [index, recipe] of recipes.entries()) {
      const ref = recipe.source;
      const entry = sources.find((candidate) => candidate.id === ref.sourceId);
      if (!entry) issue(["recipes", index, "source"], "菜谱引用的来源不存在");
      const region = inventory.regions.find((candidate) => candidate.id === ref.region);
      const row = region?.rows.find((candidate) => candidate.row === ref.row);
      if (ref.sourceId !== inventory.sourceId || !row)
        issue(["recipes", index, "source"], "菜谱引用的清点行不存在");
      if (row && recipe.name.raw !== row.nameRaw)
        issue(["recipes", index, "name"], "菜名原文与独立清点表不符");
      const key = `${ref.sourceId}/${ref.region}/${ref.row}`;
      if (rowKeys.has(key)) issue(["recipes", index, "source"], "同一图片行被重复录入");
      rowKeys.add(key);
      for (const noteId of recipe.noteIds) {
        const note = entry?.notes.find((candidate) => candidate.id === noteId);
        if (!note || !note.appliesTo.includes(ref.region))
          issue(["recipes", index, "noteIds"], `注释引用不存在或不适用：${noteId}`);
      }
      for (const note of entry?.notes ?? []) {
        if (note.appliesTo.includes(ref.region) && !recipe.noteIds.includes(note.id))
          issue(["recipes", index, "noteIds"], `缺少适用的玩家注释：${note.id}`);
      }
    }
    let total = 0;
    for (const [index, region] of inventory.regions.entries()) {
      total += region.expectedRows;
      if (region.rows.length !== region.expectedRows)
        issue(["inventory", "regions", index], "独立清点行数不匹配");
      if (source)
        checkBounds(
          region.headerBounds,
          ["inventory", "regions", index, "headerBounds"],
          source.asset,
        );
      for (const [rowIndex, row] of region.rows.entries()) {
        if (row.row !== rowIndex + 1)
          issue(["inventory", "regions", index, "rows", rowIndex], "清点行号须从 1 连续递增");
        if (source)
          checkBounds(
            row.bounds,
            ["inventory", "regions", index, "rows", rowIndex, "bounds"],
            source.asset,
          );
        if (!rowKeys.has(`${inventory.sourceId}/${region.id}/${row.row}`))
          issue(["recipes"], `缺少图片行：${region.id}/${row.row}`);
      }
    }
    if (total !== inventory.expectedTotal || recipes.length !== inventory.expectedTotal)
      issue(["recipes"], "总行数与独立清点不匹配");
  });

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeSource = z.infer<typeof sourceSchema>;
export type RecipeInventory = z.infer<typeof inventorySchema>;
export type RecipeDataset = z.infer<typeof recipeDatasetSchema>;
