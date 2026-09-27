import sources from "../../data/recipes/sources.json" with { type: "json" };
import recipes from "../../data/recipes/recipes.json" with { type: "json" };
import inventory from "../../docs/references/recipes/tomorrow-2026-09-24.inventory.json" with { type: "json" };
import { recipeDatasetSchema } from "./schema.ts";

// 页面和脚本共用此读取边界，不通过类型断言绕过 JSON 校验。
export const recipeDataset = recipeDatasetSchema.parse({ sources, recipes, inventory });
