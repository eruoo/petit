import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { recipeImages } from "../../shared/recipes/images.ts";

function expectLocalImage(value: string | null, pageUrl: string, extension: "png" | "jpg") {
  expect(value).not.toBeNull();
  const url = new URL(value!, pageUrl);
  expect(url.origin).toBe(new URL(pageUrl).origin);
  expect(url.pathname.startsWith("/_nuxt/")).toBe(true);
  expect(url.pathname.endsWith(`.${extension}`)).toBe(true);
}

test("构建只发布当前使用的 Wiki 图标，未使用的文件继续归档", () => {
  const hash = (path: URL) => createHash("sha256").update(readFileSync(path)).digest("hex");
  const archiveFiles = ["2026-09-26", "2026-10-01"].flatMap((date) => {
    const directory = new URL(
      `../../docs/references/recipes/wiki-dish-icons-${date}/`,
      import.meta.url,
    );
    return readdirSync(directory)
      .filter((name) => name.endsWith(".png"))
      .map((name) => new URL(name, directory));
  });
  const archiveHashes = new Set(archiveFiles.map(hash));
  const usedHashes = new Set(
    recipeImages
      .filter((image) => image.provider === "wiki")
      .map((image) => hash(new URL(`../../${image.localPath}`, import.meta.url))),
  );
  const outputDirectory = new URL("../../.output/public/_nuxt/", import.meta.url);
  const publishedHashes = new Set(
    readdirSync(outputDirectory)
      .filter((name) => name.endsWith(".png"))
      .map((name) => hash(new URL(name, outputDirectory)))
      .filter((value) => archiveHashes.has(value)),
  );
  expect(archiveFiles).toHaveLength(93);
  expect(publishedHashes).toEqual(usedHashes);
});

test("菜谱列表与详情显示本地候选配图", async ({ page }) => {
  await page.goto("/");
  const results = page.getByRole("list", { name: "菜谱结果" });
  await expect(results.getByRole("img")).toHaveCount(102);
  await expect(results.locator("img")).toHaveCount(101);
  const firstImage = results.getByRole("img", { name: "和煦花果茶（候选配图）", exact: true });
  await expect
    .poll(() => firstImage.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(512);
  const src = await firstImage.getAttribute("src");
  expectLocalImage(src, page.url(), "png");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("暖暖阳汤面");
  await page.getByRole("button", { name: "查看暖暖阳汤面配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("img", { name: "暖暖阳汤面（候选配图）", exact: true }),
  ).toBeVisible();
  expectLocalImage(
    await dialog
      .getByRole("img", { name: "暖暖阳汤面（候选配图）", exact: true })
      .getAttribute("src"),
    page.url(),
    "png",
  );
});

test("手机上三道缺少 Wiki 图标的菜在列表与详情显示相同攻略区域", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of ["茄茄擂辣饭", "梦幻星莓漫游派", "梦幻番茄汤汁面"]) {
    await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill(name);
    const trigger = page.getByRole("button", { name: `查看${name}配方`, exact: true });
    const thumbnail = trigger.getByRole("img", { name: `${name}（候选配图）`, exact: true });
    await expect
      .poll(() => thumbnail.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBe(1080);
    const thumbnailUrl = await thumbnail.getAttribute("src");
    expectLocalImage(thumbnailUrl, page.url(), "jpg");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    const image = dialog.getByRole("img", { name: `${name}（候选配图）`, exact: true });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", thumbnailUrl!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});

test("图片加载失败显示占位，仍可打开配方和继续查找", async ({ page }) => {
  await page.route("**/*Bamboo_Apple_Slushie_Icon*.png", (route) => route.abort());
  await page.goto("/?q=竹香苹果冰");
  const trigger = page.getByRole("button", { name: "查看竹香苹果冰配方", exact: true });
  await expect(
    trigger.getByRole("img", { name: "竹香苹果冰：图片暂不可用", exact: true }),
  ).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("img", { name: "竹香苹果冰：图片暂不可用", exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText("+60", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("和煦花果茶");
  await page.getByRole("button", { name: "查看和煦花果茶配方", exact: true }).click();
  const image = dialog.getByRole("img", { name: "和煦花果茶（候选配图）", exact: true });
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(512);
});

test("四道菜显示本地高清 PNG 与对应品质，既有配方保持", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const results = page.getByRole("list", { name: "菜谱结果" });
  await expect(results.getByRole("button")).toHaveCount(102);
  const dialog = page.getByRole("dialog");
  for (const [name, quality, background] of [
    ["胡萝卜炖肉", "紫色品质", "rgb(232, 220, 240)"],
    ["蒜香流心奶黄包", "紫色品质", "rgb(232, 220, 240)"],
    ["梦幻金玉满堂饭", "金色品质", "rgb(245, 223, 184)"],
    ["梦幻草莓奶蛋糕", "金色品质", "rgb(245, 223, 184)"],
  ] as const) {
    const trigger = results.getByRole("button", { name: `查看${name}配方`, exact: true });
    const thumbnail = trigger.getByRole("img", { name: `${name}（候选配图）`, exact: true });
    const src = await thumbnail.getAttribute("src");
    expectLocalImage(src, page.url(), "png");
    await expect(trigger.getByText(quality, { exact: true })).toBeVisible();
    await expect(trigger.locator(".recipe-image")).toHaveCSS("background-color", background);
    await trigger.click();
    const image = dialog.getByRole("img", { name: `${name}（候选配图）`, exact: true });
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBe(512);
    await expect(dialog.getByText(quality, { exact: true })).toBeVisible();
    await expect(dialog.locator(".recipe-image")).toHaveCSS("background-color", background);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.src))
      .toBe(new URL(src!, page.url()).href);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.keyboard.press("Escape");
  }
  await results.getByRole("button", { name: "查看梦幻番茄汤汁面配方", exact: true }).click();
  const ingredients = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(ingredients).toHaveCount(4);
  await expect(ingredients.nth(3)).toContainText("番茄?");
  await expect(ingredients.nth(3)).toContainText("需金色品质");
  await expect(dialog.getByText("+150", { exact: true })).toBeVisible();
  await expect(dialog.getByText("快速翻土 · 三阶", { exact: true })).toBeVisible();
});
