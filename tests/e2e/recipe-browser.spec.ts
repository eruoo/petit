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
  await page.goto("/?q=竹香苹果冰", { waitUntil: "commit" });
  const trigger = page.getByRole("button", { name: "查看竹香苹果冰配方", exact: true });
  try {
    await expect(trigger).toBeDisabled();
    await expect(page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true })).toBeDisabled();
    await expect(page.getByLabel("菜谱排序", { exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "图标视图", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "列表视图", exact: true })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "招牌菜", exact: true })).toBeDisabled();
  } finally {
    releaseScripts();
  }
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(1);
  await expect(page.getByRole("radio", { name: "招牌菜", exact: true })).toBeEnabled();
  await trigger.click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "竹香苹果冰" })).toBeVisible();
});

test("默认图标视图，键盘切换保留搜索、排序和详情焦点", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?q=海鲜+小麦&sort=energy-asc");
  const grid = page.getByRole("button", { name: "图标视图", exact: true });
  const list = page.getByRole("button", { name: "列表视图", exact: true });
  const results = page.getByRole("list", { name: "菜谱结果" });
  const buttons = results.getByRole("button");
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await expect(buttons).toHaveCount(2);
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
  await expect(results.getByRole("list", { name: "有序食材" })).toHaveCount(2);
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
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("不存在的料理");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除搜索条件", exact: true }).click();
  await expect(buttons).toHaveCount(111);
  await expect(list).toHaveAttribute("aria-pressed", "true");
});

test("宽窄屏统一搜索，旧冲突筛选失效，清空和刷新没有隐藏条件", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/?mode=filter&region=simple&q=煮锅&method=榨汁机&tag=饮品&ingredients=不存在&utm_source=test#recipe-search",
  );
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  await expect(search).toHaveValue("煮锅");
  await expect(results).toHaveCount(57);
  await expect(page.getByRole("tablist")).not.toBeAttached();
  await expect(page.getByRole("complementary", { name: "菜谱筛选" })).not.toBeAttached();
  await expect(page.getByRole("button", { name: /展开菜谱筛选|选择食材/u })).not.toBeAttached();
  await expect(page.getByRole("group", { name: "料理词条" })).not.toBeAttached();
  const searchBounds = await search.locator("..").boundingBox();
  const resultsBounds = await page.locator("#recipe-results").boundingBox();
  expect(resultsBounds!.x).toBeCloseTo(searchBounds!.x);
  expect(resultsBounds!.width).toBeCloseTo(searchBounds!.width);
  expect(resultsBounds!.width).toBeGreaterThan(1300);
  await page.getByLabel("菜谱排序", { exact: true }).selectOption("energy-desc");
  await expect(results).toHaveCount(57);
  await expect(results.first()).toHaveAccessibleName("查看梦幻鱼鲜寿司配方");
  await expect.poll(() => new URL(page.url()).searchParams.has("method")).toBe(false);
  const params = new URL(page.url()).searchParams;
  for (const key of ["mode", "region", "method", "tag", "ingredients"])
    expect(params.has(key)).toBe(false);
  expect(params.get("utm_source")).toBe("test");
  expect(new URL(page.url()).hash).toBe("#recipe-search");
  await page
    .getByRole("list", { name: "菜谱结果" })
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.slice(0, 8).map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({ path: testInfo.outputPath("recipe-search-only-desktop.png") });
  await page.setViewportSize({ width: 320, height: 850 });
  await expect(search).toHaveValue("煮锅");
  await expect(results).toHaveCount(57);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath("recipe-search-only-mobile.png") });
  await page.getByRole("button", { name: "清空搜索", exact: true }).click();
  await expect(results).toHaveCount(111);
  await expect(page.getByLabel("菜谱排序", { exact: true })).toHaveValue("energy-desc");
  await page.reload();
  await expect(search).toHaveValue("");
  await expect(results).toHaveCount(111);
  await page.goto("/?region=neighbor&method=榨汁机&tag=甜点&ingredients=未收录&mode=filter");
  await expect(search).toHaveValue("");
  await expect(results).toHaveCount(111);
});

test("窄屏图标视图双列排列，搜索和视图控件不溢出", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/?q=什锦");
  const results = page.getByRole("list", { name: "菜谱结果" });
  const buttons = results.getByRole("button");
  await expect(buttons).toHaveCount(9);
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
  await expect(results.getByRole("list", { name: "有序食材" })).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await expect(buttons).toHaveCount(9);
});

test("搜索、刷新恢复和重复食材详情可用", async ({ page }) => {
  const hydrationProblems: string[] = [];
  page.on("console", (message) => {
    if (/hydration|mismatch/iu.test(message.text())) hydrationProblems.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Petit · 星布谷地资料手册");
  await expect(page.getByRole("heading", { level: 1, name: "菜谱速查" })).toBeVisible();
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(111);
  const search = page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true });
  await search.fill("暖暖 小麦 煮锅");
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("暖暖 小麦 煮锅");
  const trigger = page.getByRole("button", { name: "查看暖暖阳汤面配方", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("list", { name: "有序食材" }).getByText(/^小麦\??$/u)).toHaveCount(
    2,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(hydrationProblems).toEqual([]);
});

test("回到搜索后输入和清空保留锚点，不滚回页顶", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  await expect(search).toBeEnabled();
  await page.getByRole("link", { name: "回到搜索 ↑", exact: true }).click();
  await expect(page).toHaveURL(/#recipe-search$/u);
  await expect
    .poll(() => search.evaluate((element) => Math.abs(element.getBoundingClientRect().top)))
    .toBeLessThan(2);
  const searchScroll = await page.evaluate(() => window.scrollY);
  expect(searchScroll).toBeGreaterThan(100);

  await search.fill("饮");
  await expect(results).toHaveCount(19);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(searchScroll, 0);
  await expect(page).toHaveURL(/#recipe-search$/u);
  await expect(search).toHaveValue("饮");
  await expect(search).toBeFocused();

  await page.getByRole("button", { name: "清空搜索", exact: true }).click();
  await expect(results).toHaveCount(111);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(searchScroll, 0);
  await expect(page).toHaveURL(/#recipe-search$/u);
});

test("纯空白不视为有效搜索，输入中的分隔空格保留", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  for (const whitespace of ["   ", "　", "\u00a0"]) {
    await search.fill(whitespace);
    await expect(search).toHaveValue(whitespace);
    await expect(results).toHaveCount(111);
    await expect(page.getByRole("heading", { name: "111 道菜谱", exact: true })).toBeVisible();
  }
  await page.reload();
  await expect(search).toBeEnabled();
  await expect(results).toHaveCount(111);
  await search.fill("饮 ");
  await expect(results).toHaveCount(19);
  await expect(search).toHaveValue("饮 ");
  await search.pressSequentially("奶");
  await expect(results).toHaveCount(3);
  await expect(search).toHaveValue("饮 奶");
  await expect(page.getByRole("heading", { name: "3 道菜谱 搜索结果", exact: true })).toBeVisible();
});

test("统一搜索承接旧食材链接，编辑、清空、排序和浏览器返回保持一致", async ({ page }) => {
  await page.goto("/?q=小麦&ingredient=小麦&ingredient=海鲜&region=signature&sort=energy-desc");
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  await expect(search).toHaveValue("小麦 海鲜");
  await expect(results).toHaveCount(2);
  await page.getByRole("button", { name: "清空搜索", exact: true }).click();
  await expect(results).toHaveCount(111);
  expect(new URL(page.url()).searchParams.has("ingredient")).toBe(false);
  expect(new URL(page.url()).searchParams.has("region")).toBe(false);
  expect(new URL(page.url()).searchParams.get("sort")).toBe("energy-desc");
  await search.fill("海鲜 小麦 烤箱");
  await page.getByLabel("菜谱排序", { exact: true }).selectOption("energy-asc");
  await expect(results).toHaveCount(1);
  await expect(results).toHaveAccessibleName("查看美味海风披萨配方");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBe("海鲜 小麦 烤箱");
  await page.goto("/about/");
  await page.goBack();
  await expect(search).toHaveValue("海鲜 小麦 烤箱");
  await expect(page.getByLabel("菜谱排序", { exact: true })).toHaveValue("energy-asc");
  await expect(results).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("海鲜 小麦 烤箱");
  await expect(results).toHaveCount(1);
});

test("烹饪方式支持完整和部分搜索，与食材及词条组合", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  for (const [method, count] of [
    ["煮锅", 57],
    ["榨汁机", 14],
    ["烤箱", 32],
  ] as const) {
    await search.fill(method);
    await expect(results).toHaveCount(count);
  }
  await search.fill("榨汁 饮 奶");
  await expect(results).toHaveCount(3);
  await search.fill("海鲜 小麦 烤箱 主食");
  await expect(results).toHaveCount(1);
  await expect(results).toHaveAccessibleName("查看美味海风披萨配方");
  await search.fill("煮锅 榨汁机");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除搜索条件", exact: true }).click();
  await expect(results).toHaveCount(111);
});

test("搜索可混合菜名、食材和词条，在手机和刷新后保持", async ({ page }, testInfo) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", {
    name: "搜索菜名、食材、词条或烹饪方式",
    exact: true,
  });
  const results = page.getByRole("list", { name: "菜谱结果" }).getByRole("button");
  await expect(search).toHaveAttribute("placeholder", /词条/u);
  await search.fill("蒜香 小麦 甜点");
  await expect(results).toHaveCount(1);
  await expect(results).toHaveAccessibleName("查看蒜香流心奶面包配方");
  await page.getByRole("button", { name: "列表视图", exact: true }).click();
  await page.reload();
  await expect(search).toHaveValue("蒜香 小麦 甜点");
  await expect(results).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 850 });
  await search.fill("谷物 奶 甜点");
  await expect(results).toHaveCount(1);
  await expect(results.nth(0)).toHaveAccessibleName("查看香米糕配方");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page
    .getByRole("list", { name: "菜谱结果" })
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({
    path: testInfo.outputPath("recipe-tag-search-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "清空搜索", exact: true }).click();
  await expect(results).toHaveCount(111);
  await search.fill("饮");
  await expect(results).toHaveCount(19);
  await expect(page.getByRole("button", { name: "查看和煦花果茶配方", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看珍蔬麦饮配方", exact: true })).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue("饮");
  await expect(results).toHaveCount(19);
  await search.fill("饮 奶");
  await expect(results).toHaveCount(3);
});

test("四槽位配方完整显示食材、力气和特殊效果", async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent("梦幻奇迹蒜龙虾")}`);
  await page.getByRole("button", { name: "查看梦幻奇迹蒜龙虾配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const slots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(slots).toHaveCount(4);
  await expect(slots.nth(3)).toContainText("贝");
  await expect(dialog.getByText("+140", { exact: true })).toBeVisible();
  await expect(dialog.getByText("轻盈潜行 · 三阶", { exact: true })).toBeVisible();
  await expect(dialog.locator(".effect-detail")).not.toContainText("60 秒");
});

test("手机上展示新版自由烹饪力气与概率产出", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=什锦+榨汁机&sort=energy-desc");
  const results = page.getByRole("list", { name: "菜谱结果" });
  await expect(results.getByRole("button")).toHaveCount(3);
  await expect(results.getByRole("button").first()).toHaveAccessibleName("查看梦幻什锦饮配方");
  await expect(results.getByRole("button").first()).toBeInViewport();
  await page.getByRole("button", { name: "查看珍稀什锦饮配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("+60", { exact: true })).toBeVisible();
  await expect(dialog.getByText("概率产出", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("烹饪界面左下角切换至自由模式，可解锁什锦系列菜谱。", { exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("可解锁什锦系列菜谱");
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("什锦 煮锅");
  await page.getByRole("button", { name: "查看珍稀什锦砂锅配方", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "菜品产出", exact: true })).toBeVisible();
  await expect(dialog.getByText("概率产出", { exact: true })).toBeVisible();
  await expect(dialog.locator(".effect-detail")).toContainText("产出概率未注明");
  await expect(dialog.locator(".effect-detail")).toContainText("具体特殊效果与阶级未说明");
  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  await page.screenshot({ path: testInfo.outputPath("mobile-recipe.png") });
});

test("友邻配方获取信息和清除空结果可用", async ({ page }) => {
  await page.goto("/?q=竹香苹果冰");
  await page.getByRole("button", { name: "查看竹香苹果冰配方", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText(/配方获取：云果/u)
      .first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("不存在的料理");
  await expect(page.getByRole("heading", { name: "没有找到匹配的菜谱" })).toBeVisible();
  await page.getByRole("button", { name: "清除搜索条件", exact: true }).click();
  await expect(page.getByRole("list", { name: "菜谱结果" }).getByRole("button")).toHaveCount(111);
  await expect(page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true })).toHaveValue("");
});
