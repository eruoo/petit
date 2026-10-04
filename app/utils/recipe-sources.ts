import type { RecipeSource } from "../../shared/recipes/schema";

// 发布资源仅包含主体图和参考图；历史图鉴与游戏效果截图留在本地资料中。
const sourceUrls = import.meta.glob<string>(
  [
    "../../docs/references/recipes/tomorrow-2026-09-29.jpg",
    "../../docs/references/recipes/xiaoming-09-30.png",
  ],
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export function getRecipeSourceImageUrl(source: RecipeSource): string {
  const path = source.asset.path;
  const url = sourceUrls[`../../${path}`];
  if (!url) throw new Error(`Missing recipe source image: ${path}`);
  return url;
}
