export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig(event).public.siteUrl.trim();
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  const rules = ["User-agent: *", "Allow: /"];
  if (siteUrl) rules.push(`Sitemap: ${new URL("/sitemap.xml", siteUrl).href}`);
  return `${rules.join("\n")}\n`;
});
