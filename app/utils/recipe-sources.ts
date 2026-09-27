import type { RecipeSource } from "../../shared/recipes/schema";

// 站点只打包当前图鉴；更新转录依据时同步调整此资源入口，历史原图保留在资料目录。
const sourceUrls = import.meta.glob<string>(
  "../../docs/references/recipes/tomorrow-2026-09-24.jpg",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export function getRecipeSourceImageUrl(source: RecipeSource): string {
  const url = sourceUrls[`../../${source.asset.path}`];
  if (!url) throw new Error(`Missing recipe source image: ${source.asset.path}`);
  return url;
}
