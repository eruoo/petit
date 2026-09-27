import { expect, test } from "@playwright/test";

test("关于页分列菜谱与图片来源并单独致谢，只展示最新版图鉴并支持详情定位", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("明天攻略组");
  const navigation = page.getByRole("navigation", { name: "主导航" });
  await navigation.getByRole("link", { name: "关于", exact: true }).click();
  await expect(page).toHaveURL(/\/about\/?$/u);
  await expect(page.getByRole("heading", { level: 1, name: "关于 Petit" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "关于", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const recipeSource = page.getByRole("region", { name: "菜谱资料来源", exact: true });
  const imageSources = page.getByRole("region", { name: "图片来源", exact: true });
  const thanks = page.getByRole("region", { name: "特别致谢", exact: true });
  await expect(recipeSource).toContainText("明天攻略组 星布谷地菜谱图鉴");
  await expect(recipeSource).not.toContainText(/Wiki|TapTap/u);
  await expect(imageSources).toContainText("Petit Planet Wiki");
  await expect(imageSources).toContainText("TapTap 作者「阿Zz」");
  await expect(thanks).toContainText("感谢 明天攻略组");
  await expect(thanks).toContainText("Petit Planet Wiki 社区");
  await expect(thanks).toContainText("作者「阿Zz」");
  const latestImage = page.getByRole("link", { name: "查看最新版图鉴（2026-09-24）" });
  await expect(latestImage).toHaveAttribute("href", /tomorrow-2026-09-24\.[\w-]+\.jpg$/u);
  const guideImage = page.getByRole("img", {
    name: "明天攻略组 星布谷地菜谱图鉴（2026-09-24）",
    exact: true,
  });
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(1);
  await expect
    .poll(() => guideImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBe(4355);
  await expect(page.getByRole("main")).not.toContainText(/2026-09-23|历史资料|如何阅读这些记录/u);
  const latestImageResponse = await page.request.get((await latestImage.getAttribute("href"))!);
  expect(latestImageResponse.status()).toBe(200);
  expect(latestImageResponse.headers()["content-type"]).toContain("image/jpeg");
  await expect(imageSources.getByRole("link", { name: "Wiki 菜品图标目录" })).toHaveAttribute(
    "href",
    "https://petitplanet.wiki/Category:Dish_Icons",
  );
  await expect(imageSources.getByRole("link", { name: "TapTap 简单菜篇" })).toHaveAttribute(
    "href",
    "https://www.taptap.cn/moment/851862566224266917",
  );
  await expect(imageSources.getByRole("link", { name: "TapTap 招牌菜篇" })).toHaveAttribute(
    "href",
    "https://www.taptap.cn/moment/852148878751829285",
  );
  await expect(imageSources.getByRole("link", { name: "TapTap 宴客菜篇" })).toHaveAttribute(
    "href",
    "https://www.taptap.cn/moment/852582459005469363",
  );
  await expect(page.getByRole("heading", { name: "版权说明" })).toBeVisible();
  await expect(page.getByText("如有侵权", { exact: false })).toBeVisible();
  const response = await page.reload();
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "关于 Petit" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navigation.getByRole("link", { name: "菜谱", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await navigation.getByRole("link", { name: "菜谱", exact: true }).click();
  await page.getByRole("button", { name: "查看和煦花果茶配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).not.toContainText("明天攻略组");
  await dialog.getByRole("link", { name: "查看资料说明与来源" }).click();
  await expect(page).toHaveURL(/\/about\/?#tomorrow-20260924-image$/u);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(guideImage).toBeInViewport();
  await expect(page.getByRole("link", { name: /旧版原图/u })).not.toBeAttached();
});
