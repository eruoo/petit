import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const siteOrigin = new URL(process.env.NUXT_PUBLIC_SITE_URL ?? "https://petit.eruoo.dev").origin;

for (const { path, title, description } of [
  {
    path: "/",
    title: "Petit · 星布谷地资料手册",
    description: "Petit 是一个非官方的《星布谷地》资料站，方便玩家查阅游戏信息。目前提供菜谱速查。",
  },
  {
    path: "/about",
    title: "关于 Petit · 星布谷地资料手册",
    description: "了解 Petit 非官方星布谷地资料站，以及菜谱资料、菜品图片的来源与致谢。",
  },
]) {
  test(`${path} 的静态 HTML 为无脚本抓取提供分享元数据`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      const expectedMeta = {
        description,
        "og:title": title,
        "og:description": description,
        "og:type": "website",
        "og:site_name": "Petit",
        "og:locale": "zh_CN",
        "og:url": `${siteOrigin}${path}`,
        "og:image": `${siteOrigin}/og-image.png`,
        "og:image:type": "image/png",
        "og:image:width": "1200",
        "og:image:height": "630",
        "og:image:alt": "奶油色背景上的 Petit 星布谷地资料手册文字与苹果树小星球。",
        "twitter:card": "summary_large_image",
        "twitter:title": title,
        "twitter:description": description,
        "twitter:image": `${siteOrigin}/og-image.png`,
        "twitter:image:alt": "奶油色背景上的 Petit 星布谷地资料手册文字与苹果树小星球。",
      };
      for (const [name, content] of Object.entries(expectedMeta)) {
        const attribute = name.startsWith("og:") ? "property" : "name";
        await expect(page.locator(`head meta[${attribute}="${name}"]`)).toHaveAttribute(
          "content",
          content,
        );
      }
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${siteOrigin}${path}`,
      );
    } finally {
      await context.close();
    }
  });
}

test("搜索与客户端导航更新页面元数据，canonical 不包含展示参数", async ({ page }) => {
  await page.goto("/?q=苹果&sort=energy-asc&view=list");
  const canonical = page.locator('head link[rel="canonical"]');
  const ogUrl = page.locator('head meta[property="og:url"]');
  await expect(canonical).toHaveAttribute("href", `${siteOrigin}/`);
  await expect(ogUrl).toHaveAttribute("content", `${siteOrigin}/`);
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于" })
    .click();
  await expect(page).toHaveTitle("关于 Petit · 星布谷地资料手册");
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    "content",
    "关于 Petit · 星布谷地资料手册",
  );
  await expect(canonical).toHaveAttribute("href", `${siteOrigin}/about`);
  await expect(ogUrl).toHaveAttribute("content", `${siteOrigin}/about`);
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "菜谱" })
    .click();
  await expect(page).toHaveTitle("Petit · 星布谷地资料手册");
  await expect(canonical).toHaveAttribute("href", `${siteOrigin}/`);
  await expect(ogUrl).toHaveAttribute("content", `${siteOrigin}/`);
});

test("分享图可从静态服务抓取，文件和声明的尺寸一致", async ({ request }) => {
  const response = await request.get("/og-image.png");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
  const bytes = await response.body();
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
  expect(bytes.equals(await readFile("public/og-image.png"))).toBe(true);
});
