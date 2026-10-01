import { expect, test } from "@playwright/test";
import { currentRecipes } from "../../shared/recipes/current";

test("无脚本首页链接覆盖全部配方，每个详情地址均可直接抓取", async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const links = page.getByRole("list", { name: "菜谱结果" }).getByRole("link");
    const paths = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
    expect(paths).toEqual(currentRecipes.map((recipe) => `/recipes/${recipe.id}`));
    for (const path of paths) {
      const response = await request.get(path!, { maxRedirects: 0 });
      expect(response.status(), path!).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
    }
  } finally {
    await context.close();
  }
});

for (const { id, name, ingredients, effect } of [
  {
    id: "mt-20260924-signature-033",
    name: "梦幻奇迹蒜龙虾",
    ingredients: ["龙虾", "蔬菜", "大蒜", "贝类"],
    effect: "轻盈潜行 · 三阶",
  },
  {
    id: "mt-20260924-neighbor-001",
    name: "竹香苹果冰",
    ingredients: ["竹笋", "水果"],
    effect: "大力敲伐 · 一阶",
  },
  {
    id: "xm-0927-neighbor-006",
    name: "甜饼果茶",
    ingredients: ["小麦", "水果"],
    effect: "无特殊效果",
  },
  {
    id: "mt-20260924-free-002",
    name: "珍稀什锦砂锅",
    ingredients: ["素食/荤菜", "素食/荤菜"],
    effect: "概率产出",
  },
]) {
  test(`${name}的食材与效果可在禁用脚本时阅读`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto("/");
      const link = page.getByRole("link", { name: `${name}的完整配方`, exact: true });
      await expect(link).toHaveAttribute("href", `/recipes/${id}`);
      await link.click();
      await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeVisible();
      const slots = page.getByRole("list", { name: "有序食材" }).getByRole("listitem");
      await expect(slots).toHaveCount(ingredients.length);
      for (const [index, ingredient] of ingredients.entries()) {
        await expect(slots.nth(index)).toContainText(ingredient);
      }
      await expect(page.locator(".recipe-facts")).toContainText("烹饪方式");
      await expect(page.locator(".effect-detail")).toContainText(effect);
      await page.getByRole("link", { name: "返回菜谱速查" }).click();
      await expect(page.getByRole("heading", { name: "菜谱速查", exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test("详情页客户端导航更新元数据，手机正文完整且弹窗内容一致", async ({ page }, testInfo) => {
  await page.goto("/?q=梦幻奇迹蒜龙虾");
  await page.getByRole("button", { name: "查看梦幻奇迹蒜龙虾配方", exact: true }).click();
  const dialogText = await page.getByRole("dialog").locator(".recipe-detail-content").innerText();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "梦幻奇迹蒜龙虾的完整配方", exact: true }).click();
  await expect(page).toHaveURL(/\/recipes\/mt-20260924-signature-033$/u);
  await expect(page).toHaveTitle("梦幻奇迹蒜龙虾配方 · 星布谷地 · Petit");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "梦幻奇迹蒜龙虾配方 · 星布谷地 · Petit",
  );
  expect(await page.locator(".recipe-detail-content").innerText()).toBe(dialogText);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({
      path: testInfo.outputPath(`recipe-page-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于" })
    .click();
  await expect(page).toHaveTitle("关于 Petit · 星布谷地资料手册");
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "菜谱" })
    .click();
  await expect(page).toHaveTitle("Petit · 星布谷地资料手册");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Petit · 星布谷地资料手册",
  );
});

test("不存在的配方返回 404", async ({ request }) => {
  const response = await request.get("/recipes/seo-check-missing-recipe");
  expect(response.status()).toBe(404);
});
