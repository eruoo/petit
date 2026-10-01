import { readFile } from "node:fs/promises";
import { expect, test, type Locator } from "@playwright/test";

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL?.trim() ?? "https://petit.eruoo.dev";
const siteOrigin = siteUrl ? new URL(siteUrl).origin : undefined;
const imageUrl = siteOrigin ? `${siteOrigin}/og-image.png` : undefined;

async function expectOptionalAttribute(
  locator: Locator,
  attribute: string,
  value: string | undefined,
) {
  if (value === undefined) {
    await expect(locator).toHaveCount(0);
  } else {
    await expect(locator).toHaveAttribute(attribute, value);
  }
}

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
        "og:url": siteOrigin ? `${siteOrigin}${path}` : undefined,
        "og:image": imageUrl,
        "og:image:type": imageUrl ? "image/png" : undefined,
        "og:image:width": imageUrl ? "1200" : undefined,
        "og:image:height": imageUrl ? "630" : undefined,
        "og:image:alt": imageUrl
          ? "奶油色背景上的 Petit 星布谷地资料手册文字与草地、河流和曲奇地面组成的小星球。"
          : undefined,
        "twitter:card": "summary_large_image",
        "twitter:title": title,
        "twitter:description": description,
        "twitter:image": imageUrl,
        "twitter:image:alt": imageUrl
          ? "奶油色背景上的 Petit 星布谷地资料手册文字与草地、河流和曲奇地面组成的小星球。"
          : undefined,
      };
      for (const [name, content] of Object.entries(expectedMeta)) {
        const attribute = name.startsWith("og:") ? "property" : "name";
        await expectOptionalAttribute(
          page.locator(`head meta[${attribute}="${name}"]`),
          "content",
          content,
        );
      }
      await expectOptionalAttribute(
        page.locator('head link[rel="canonical"]'),
        "href",
        siteOrigin ? `${siteOrigin}${path}` : undefined,
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
  await expectOptionalAttribute(canonical, "href", siteOrigin ? `${siteOrigin}/` : undefined);
  await expectOptionalAttribute(ogUrl, "content", siteOrigin ? `${siteOrigin}/` : undefined);
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于" })
    .click();
  await expect(page).toHaveTitle("关于 Petit · 星布谷地资料手册");
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    "content",
    "关于 Petit · 星布谷地资料手册",
  );
  await expectOptionalAttribute(canonical, "href", siteOrigin ? `${siteOrigin}/about` : undefined);
  await expectOptionalAttribute(ogUrl, "content", siteOrigin ? `${siteOrigin}/about` : undefined);
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "菜谱" })
    .click();
  await expect(page).toHaveTitle("Petit · 星布谷地资料手册");
  await expectOptionalAttribute(canonical, "href", siteOrigin ? `${siteOrigin}/` : undefined);
  await expectOptionalAttribute(ogUrl, "content", siteOrigin ? `${siteOrigin}/` : undefined);
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
