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
    await expect(page.getByRole("button", { name: "图标视图", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "列表视图", exact: true })).toBeDisabled();
  } finally {
    releaseScripts();
  }
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(1);
  await trigger.click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "竹香苹果冰" })).toBeVisible();
});

test("默认图标视图，键盘切换保留筛选、排序和详情焦点", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?q=小麦&region=simple&sort=energy-desc");
  const grid = page.getByRole("button", { name: "图标视图", exact: true });
  const list = page.getByRole("button", { name: "列表视图", exact: true });
  const results = page.getByRole("list", { name: "菜谱结果" });
  const buttons = results.getByRole("button");
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await expect(buttons).toHaveCount(4);
  await expect(buttons.first()).toHaveAccessibleName("查看海鲜大铺面配方");
  const layout = await buttons.evaluateAll((elements) =>
    elements.slice(0, 2).map((element) => {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y };
    }),
  );
  expect(layout[0]!.y).toBe(layout[1]!.y);
  expect(layout[1]!.x).toBeGreaterThan(layout[0]!.x);
  const url = page.url();
  const names = await buttons.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label")),
  );
  await results
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({ path: testInfo.outputPath("recipe-grid-desktop.png") });
  await list.press("Enter");
  await expect(list).toHaveAttribute("aria-pressed", "true");
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  await expect(results.getByRole("list", { name: "有序食材" })).toHaveCount(4);
  await expect(page).toHaveURL(url);
  expect(
    await buttons.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")),
    ),
  ).toEqual(names);
  const listLayout = await buttons.evaluateAll((elements) =>
    elements.slice(0, 2).map((element) => element.getBoundingClientRect().y),
  );
  expect(listLayout[1]).toBeGreaterThan(listLayout[0]!);
  for (const view of [list, grid]) {
    await view.press("Enter");
    const trigger = buttons.first();
    await trigger.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "海鲜大铺面", exact: true })).toBeVisible();
    await expect(dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem")).toHaveCount(
      2,
    );
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await list.click();
  await page.getByLabel("搜索菜名或食材", { exact: true }).fill("不存在的料理");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除筛选", exact: true }).click();
  await expect(buttons).toHaveCount(94);
  await expect(list).toHaveAttribute("aria-pressed", "true");
});

test("窄屏图标视图双列排列，长菜名和切换控件不溢出", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/?region=guest");
  const results = page.getByRole("list", { name: "菜谱结果" });
  const buttons = results.getByRole("button");
  await expect(buttons).toHaveCount(14);
  const positions = await buttons.evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => {
      const { x, y } = element.getBoundingClientRect();
      return { x, y };
    }),
  );
  expect(positions[0]!.y).toBe(positions[1]!.y);
  expect(positions[1]!.x).toBeGreaterThan(positions[0]!.x);
  expect(positions[2]!.y).toBeGreaterThan(positions[0]!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const grid = page.getByRole("button", { name: "图标视图", exact: true });
  const list = page.getByRole("button", { name: "列表视图", exact: true });
  await expect(grid).toBeInViewport();
  await expect(list).toBeInViewport();
  await results
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.slice(0, 4).map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({ path: testInfo.outputPath("recipe-grid-mobile.png") });
  await list.click();
  await expect(results.getByRole("list", { name: "有序食材" })).toHaveCount(14);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await expect(buttons).toHaveCount(14);
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
