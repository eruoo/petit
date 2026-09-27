import { expect, test } from "@playwright/test";

test("初始化完成前禁用操作，完成后首次点击即可打开详情", async ({ page }) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/_nuxt/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  await page.goto("/?region=neighbor", { waitUntil: "commit" });
  const trigger = page.getByRole("button", { name: "查看竹香苹果冰配方", exact: true });
  try {
    await expect(trigger).toBeDisabled();
    await expect(page.getByLabel("搜索菜名或食材", { exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "煮锅", exact: true })).toBeDisabled();
    await expect(page.getByLabel("食材", { exact: true })).toBeDisabled();
    await expect(page.getByLabel("菜谱排序", { exact: true })).toBeDisabled();
  } finally {
    releaseScripts();
  }
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(1);
  await trigger.click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "竹香苹果冰" })).toBeVisible();
});

test("组合筛选、刷新恢复和重复食材详情可用", async ({ page }) => {
  const hydrationProblems: string[] = [];
  page.on("console", (message) => {
    if (/hydration|mismatch/iu.test(message.text())) hydrationProblems.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Petit");
  await expect(page.getByRole("heading", { level: 1, name: "菜谱速查" })).toBeVisible();
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(94);
  await page.getByLabel("搜索菜名或食材", { exact: true }).fill("小麦");
  await expect(page).toHaveURL(/q=/u);
  await page.getByRole("button", { name: /^简单菜/u }).click();
  await expect(page).toHaveURL(/region=simple/u);
  await page.getByRole("button", { name: "煮锅", exact: true }).click();
  await expect(page).toHaveURL(/method=/u);
  await page.getByLabel("食材", { exact: true }).selectOption("小麦");
  await expect(page).toHaveURL(/ingredient=/u);
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(4);
  await page.reload();
  await expect(page.getByLabel("搜索菜名或食材", { exact: true })).toHaveValue("小麦");
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(4);
  const trigger = page.getByRole("button", { name: "查看暖暖阳汤面配方", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("list", { name: "有序食材" }).getByText("小麦", { exact: true }),
  ).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(hydrationProblems).toEqual([]);
});

test("四槽位扩展行和原尺寸图片可追溯", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent("梦幻奇迹蒜龙虾")}`);
  await page.getByRole("button", { name: "查看梦幻奇迹蒜龙虾配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const slots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(slots).toHaveCount(4);
  await expect(slots.nth(3)).toContainText("贝类");
  await expect(dialog.getByText("+140", { exact: true })).toBeVisible();
  await expect(dialog.getByText("轻盈潜行 · 三阶", { exact: true })).toBeVisible();
  await dialog.getByText("核对原图这一行", { exact: true }).click();
  const image = dialog.getByRole("img", { name: "原图招牌菜第33行：梦幻奇迹蒜龙虾" });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(4355);
  const sourceLink = dialog.getByRole("link", { name: "打开完整原图" });
  expect(await sourceLink.getAttribute("href")).toMatch(/tomorrow-2026-09-24\.[\w-]+\.jpg$/u);
});

test("手机上展示新版自由烹饪力气与概率产出", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?region=free&method=%E6%A6%A8%E6%B1%81%E6%9C%BA&sort=energy-desc");
  const results = page.getByRole("list", { name: "菜谱结果" });
  await expect(results.getByRole("button")).toHaveCount(3);
  await expect(results.getByRole("button").first()).toHaveAccessibleName("查看梦幻什锦饮配方");
  await expect(results.getByRole("button").first()).toBeInViewport();
  await page.getByRole("button", { name: "查看珍稀什锦饮配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("+60", { exact: true })).toBeVisible();
  await expect(dialog.getByText("概率产出", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("只能通过自由烹饪得到，不在菜谱内显示", { exact: false }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "展开菜谱筛选", exact: true }).click();
  await page.getByRole("button", { name: "煮锅", exact: true }).click();
  await page.getByRole("button", { name: "收起菜谱筛选", exact: true }).click();
  await page.getByRole("button", { name: "查看珍稀什锦砂锅配方", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "菜品产出", exact: true })).toBeVisible();
  await expect(dialog.getByText(/原文“概率出”描述菜品产出/u)).toBeVisible();
  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  await page.screenshot({ path: testInfo.outputPath("mobile-recipe.png") });
});

test("友邻秘方解锁说明和清除空结果可用", async ({ page }) => {
  await page.goto("/?region=neighbor");
  await page.getByRole("button", { name: "查看竹香苹果冰配方", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText(/只能通过友邻赠送获得，且只能在配方解锁后用配方制作/u)
      .first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名或食材", { exact: true }).fill("不存在的料理");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除筛选", exact: true }).click();
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(94);
  await expect(page.getByLabel("搜索菜名或食材", { exact: true })).toHaveValue("");
});
