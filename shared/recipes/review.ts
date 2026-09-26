import type { Recipe } from "./schema.ts";

export function collectRecipeReviewItems(recipes: Recipe[]) {
  return recipes.flatMap((recipe) => {
    const items: {
      recipeId: string;
      region: Recipe["source"]["region"];
      row: number;
      field: string;
      status: string;
      raw: string;
      reason: string;
    }[] = [];
    const add = (field: string, status: string, raw: string, reason: string) =>
      items.push({
        recipeId: recipe.id,
        region: recipe.source.region,
        row: recipe.source.row,
        field,
        status,
        raw,
        reason,
      });
    function visit(value: unknown, path: string) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((child, index) => visit(child, `${path}.${index}`));
        return;
      }
      const object = value as Record<string, unknown>;
      if (
        typeof object.status === "string" &&
        ["tentative", "unknown", "unresolved"].includes(object.status)
      ) {
        add(path, object.status, String(object.raw), String(object.reason));
      } else {
        Object.entries(object).forEach(([key, child]) =>
          visit(child, path ? `${path}.${key}` : key),
        );
      }
    }
    visit(recipe, "");
    for (const note of recipe.reviewNotes) {
      if (!items.some((item) => item.field === note.field))
        add(note.field, "review-note", "", note.reason);
    }
    return items;
  });
}
