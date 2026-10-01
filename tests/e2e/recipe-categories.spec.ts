import { expect, test } from "@playwright/test";

test("分类在搜索上方，与关键词组合并保留排序和视图，分别清空与整体重置", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const categories = page.getByRole("group", { name: "菜谱分类", exact: true });
  const search = page.getByRole("searchbox");
  const recipes = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  await expect(search).toBeEnabled();
  await expect(categories.getByRole("radio", { name: "全部", exact: true })).toBeChecked();
  await expect(recipes).toHaveCount(102);
  const bounds = await categories.locator("label").evaluateAll((elements) =>
    elements.map((element) => {
      const { y, bottom } = element.getBoundingClientRect();
      return { y, bottom };
    }),
  );
  expect(new Set(bounds.map((box) => box.y)).size).toBe(1);
  const searchBounds = await search.locator("..").boundingBox();
  expect(searchBounds!.y - bounds[0]!.bottom).toBeCloseTo(12);
  await categories.getByText("招牌菜", { exact: true }).click();
  await expect(recipes).toHaveCount(33);
  await expect(page).toHaveURL(/category=signature/u);
  await page
    .getByRole("list", { name: "菜谱结果" })
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.slice(0, 8).map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({ path: testInfo.outputPath("recipe-categories-desktop.png") });
  await page.getByRole("button", { name: "列表视图", exact: true }).click();
  await page.getByLabel("菜谱排序", { exact: true }).selectOption("energy-desc");
  await search.fill("奶");
  await expect(recipes).toHaveCount(5);
  await categories.getByText("简单菜", { exact: true }).click();
  await expect(recipes).toHaveCount(1);
  await expect(recipes.first()).toHaveAccessibleName("查看绵绵麦奶配方");
  await expect(search).toHaveValue("奶");
  await expect(page.getByLabel("菜谱排序", { exact: true })).toHaveValue("energy-desc");
  await expect(page.getByRole("button", { name: "列表视图", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "清空搜索", exact: true }).click();
  await expect(recipes).toHaveCount(37);
  await expect(categories.getByRole("radio", { name: "简单菜", exact: true })).toBeChecked();
  await search.fill("奶");
  await categories.getByText("全部", { exact: true }).click();
  await expect(search).toHaveValue("奶");
  await expect.poll(() => new URL(page.url()).searchParams.has("category")).toBe(false);
  await categories.getByText("简单菜", { exact: true }).click();
  await search.fill("什锦");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除搜索条件", exact: true }).click();
  await expect(recipes).toHaveCount(102);
  await expect(search).toHaveValue("");
  await expect(categories.getByRole("radio", { name: "全部", exact: true })).toBeChecked();
  await expect(page.getByLabel("菜谱排序", { exact: true })).toHaveValue("energy-desc");
  await expect(page.getByRole("button", { name: "列表视图", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("手机分类三列两行，支持方向键、刷新与导航恢复", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/?category=guest&q=奶&sort=energy-asc&utm_source=test");
  const categories = page.getByRole("group", { name: "菜谱分类", exact: true });
  const search = page.getByRole("searchbox");
  const guest = categories.getByRole("radio", { name: "宴客菜", exact: true });
  await expect(guest).toBeChecked();
  await expect(search).toHaveValue("奶");
  const names = await page
    .getByRole("list", { name: "菜谱结果" })
    .getByRole("button")
    .allTextContents();
  expect(names.length).toBeGreaterThan(0);
  await page
    .getByRole("list", { name: "菜谱结果" })
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 850 });
    const bounds = await categories.locator("label").evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height, bottom } = element.getBoundingClientRect();
        return { x, y, width, height, bottom };
      }),
    );
    expect(bounds).toHaveLength(6);
    expect(new Set(bounds.slice(0, 3).map((box) => box.y)).size).toBe(1);
    expect(new Set(bounds.slice(3).map((box) => box.y)).size).toBe(1);
    expect(bounds[3]!.y).toBeGreaterThan(bounds[0]!.y);
    expect(bounds.every((box) => box.height >= 44 && box.width >= 44)).toBe(true);
    expect((await search.locator("..").boundingBox())!.y - bounds[5]!.bottom).toBeCloseTo(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: testInfo.outputPath(`recipe-categories-${width}.png`) });
  }
  await guest.focus();
  await page.keyboard.press("ArrowRight");
  await expect(categories.getByRole("radio", { name: "自由烹饪", exact: true })).toBeChecked();
  await expect(categories.getByRole("radio", { name: "自由烹饪", exact: true })).toBeFocused();
  await expect(search).toHaveValue("奶");
  await page.keyboard.press("ArrowLeft");
  await expect(guest).toBeChecked();
  await expect.poll(() => new URL(page.url()).searchParams.get("category")).toBe("guest");
  await page.reload();
  await expect(guest).toBeChecked();
  await expect(search).toHaveValue("奶");
  await expect(page.getByLabel("菜谱排序", { exact: true })).toHaveValue("energy-asc");
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about/u);
  await page.goBack();
  await expect(guest).toBeChecked();
  await expect(search).toHaveValue("奶");
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveText(names);
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("test");
});
