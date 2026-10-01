import { currentRecipes } from "#shared/recipes/current";

export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl.trim();
  if (!siteUrl) {
    throw createError({ statusCode: 404, statusMessage: "Site URL is not configured" });
  }
  const paths = ["/", "/about", ...currentRecipes.map((recipe) => `/recipes/${recipe.id}`)];
  const entries = paths.map((path) => {
    const url = new URL(path, siteUrl).href
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    return `  <url><loc>${url}</loc></url>`;
  });
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
});
