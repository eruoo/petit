import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`图鉴打开后能立即关闭并返回焦点（${reducedMotion}）`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await expect(page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true })).toBeEnabled();
    await page
      .getByRole("navigation", { name: "主导航" })
      .getByRole("link", { name: "关于", exact: true })
      .click();
    // 放慢开场过渡，确保慢速测试环境也能覆盖“已显示但动画未结束”的关闭操作。
    await page.addStyleTag({
      content: ".guide-image-viewer.viewer-transition { transition-duration: 2s !important; }",
    });

    for (const closeWithEscape of [false, true]) {
      const trigger = page.locator(".guide-image-link").nth(closeWithEscape ? 1 : 0);
      await trigger.click();
      // 不等待图片标题或解码；它们可能要到开场动画结束后才出现。
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      if (closeWithEscape) await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: "关闭图片预览" }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.locator("body")).not.toHaveClass(/viewer-open/u);
    }
  });
}

test("图鉴预览支持原尺寸、缩放拖动、切图和键盘返回", async ({ page, context }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  // 先从已初始化的首页进入，避免在水合前点击到原图回退链接。
  await page.goto("/");
  await expect(page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true })).toBeEnabled();
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于", exact: true })
    .click();
  const trigger = page.getByRole("link", { name: "查看小铭同学qaQ233图鉴（9月30日）" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "小铭同学qaQ233 · 图片日期 9月30日" });
  await expect(dialog).toBeVisible();
  expect(context.pages()).toHaveLength(1);
  const image = dialog.locator(".viewer-canvas > img");
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(1280);
  await expect(dialog.getByRole("button", { name: "下一张", exact: true })).toHaveAttribute(
    "aria-disabled",
    "false",
  );
  await dialog.getByRole("button", { name: "下一张", exact: true }).click();
  const referenceDialog = page.getByRole("dialog", { name: "明天攻略组 · 图片日期 2026-09-24" });
  await expect(referenceDialog).toBeVisible();
  await expect
    .poll(() =>
      referenceDialog
        .locator(".viewer-canvas > img")
        .evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBe(4355);
  await expect(referenceDialog.getByRole("link", { name: "打开原图" })).toHaveAttribute(
    "href",
    /tomorrow-2026-09-24\.[\w-]+\.jpg$/u,
  );
  await expect(
    referenceDialog.getByRole("button", { name: "下一张", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await referenceDialog.getByRole("button", { name: "上一张", exact: true }).click();
  await expect(dialog).toBeVisible();

  const width = () => image.evaluate((element) => element.getBoundingClientRect().width);
  await dialog.getByRole("button", { name: "原尺寸", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(width).toBe(1280);
  const oldX = await image.evaluate((element) => element.getBoundingClientRect().x);
  await page.mouse.move(500, 220);
  await page.mouse.down();
  await page.mouse.move(650, 280, { steps: 6 });
  await page.mouse.up();
  await expect
    .poll(() => image.evaluate((element) => element.getBoundingClientRect().x))
    .toBeGreaterThan(oldX + 100);

  await dialog.getByRole("button", { name: "适应屏幕", exact: true }).click();
  await expect.poll(width).toBeLessThan(page.viewportSize()!.width);
  // 新图原宽已接近视口；必须等适应动画结束后再记录缩放基准。
  await image.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const fittedWidth = await width();
  await dialog.getByRole("button", { name: "放大", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect.poll(width).toBeGreaterThan(fittedWidth);
  await dialog.getByRole("button", { name: "缩小", exact: true }).click();
  await expect.poll(width).toBeCloseTo(fittedWidth, 0);
  await page.mouse.move(500, 220);
  await page.mouse.wheel(0, -120);
  await expect.poll(width).toBeGreaterThan(fittedWidth);

  await dialog.getByRole("button", { name: "放大", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "关闭图片预览" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "放大", exact: true })).toBeFocused();

  const popupPromise = page.waitForEvent("popup");
  await dialog.getByRole("link", { name: "打开原图" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/xiaoming-09-30\.[\w-]+\.png$/u);
  await popup.close();
  await dialog.getByRole("button", { name: "下一张", exact: true }).click();
  const otherDialog = page.getByRole("dialog", { name: "明天攻略组 · 图片日期 2026-09-24" });
  await expect(otherDialog).toBeVisible();
  await expect(otherDialog.getByRole("link", { name: "打开原图" })).toHaveAttribute(
    "href",
    /tomorrow-2026-09-24\.[\w-]+\.jpg$/u,
  );
  await expect(otherDialog.getByRole("button", { name: "下一张", exact: true })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  const captionBox = (await otherDialog.locator(".viewer-title").boundingBox())!;
  expect(captionBox.x).toBeGreaterThanOrEqual(0);
  expect(captionBox.x + captionBox.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({
    path: testInfo.outputPath("guide-preview-desktop.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "关闭图片预览" }).click();
  await expect(trigger).toBeFocused();
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "菜谱", exact: true })
    .click();
  await expect(page.locator(".guide-image-viewer")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("手机图鉴预览支持触摸缩放，按钮无溢出并可返回原位置", async ({
  browser,
  baseURL,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true })).toBeEnabled();
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "关于", exact: true })
    .click();
  const trigger = page.getByRole("link", { name: "查看小铭同学qaQ233图鉴（9月30日）" });
  await trigger.tap();
  const dialog = page.getByRole("dialog", { name: "小铭同学qaQ233 · 图片日期 9月30日" });
  await expect(dialog).toBeVisible();
  const image = dialog.locator(".viewer-canvas > img");
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBe(1280);
  const width = () => image.evaluate((element) => element.getBoundingClientRect().width);
  const fittedWidth = await width();
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 145, y: 340, id: 0 },
      { x: 245, y: 340, id: 1 },
    ],
  });
  for (let step = 1; step <= 5; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: 145 - step * 15, y: 340, id: 0 },
        { x: 245 + step * 15, y: 340, id: 1 },
      ],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(width).toBeGreaterThan(fittedWidth * 1.5);
  await dialog.getByRole("button", { name: "原尺寸", exact: true }).tap();
  await expect.poll(width).toBe(1280);
  await dialog.getByRole("button", { name: "适应屏幕", exact: true }).tap();
  await expect.poll(width).toBeLessThan(390);
  for (const control of await dialog.locator('[role="button"]:visible, a[href]').all()) {
    const box = (await control.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const captionBox = (await dialog.locator(".viewer-title").boundingBox())!;
  expect(captionBox.x).toBeGreaterThanOrEqual(0);
  expect(captionBox.x + captionBox.width).toBeLessThanOrEqual(390);
  await expect(dialog.locator(".viewer-tooltip")).toHaveAttribute("aria-hidden", "true");
  await page.screenshot({
    path: testInfo.outputPath("guide-preview-mobile.png"),
    animations: "disabled",
  });
  await dialog.getByRole("button", { name: "关闭图片预览" }).tap();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await context.close();
});

test("禁用脚本时图鉴仍提供可访问的原图链接", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/about/");
  const trigger = page.getByRole("link", { name: "查看小铭同学qaQ233图鉴（9月30日）" });
  const popupPromise = page.waitForEvent("popup");
  await trigger.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/xiaoming-09-30\.[\w-]+\.png$/u);
  await context.close();
});

test("关于页简述资料来源，分列图片来源与致谢并展示两张图鉴", async ({ page }, testInfo) => {
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
  const imageSources = page.getByRole("region", { name: "菜品图片来源", exact: true });
  const thanks = page.getByRole("region", { name: "特别致谢", exact: true });
  await expect(page.getByRole("main")).not.toContainText("雪菜");
  await expect(recipeSource).toContainText("小铭同学qaQ233、明天攻略组 的菜谱图鉴");
  await expect(recipeSource).toContainText("用户提供的游戏截图与文字资料");
  await expect(recipeSource).not.toContainText(/Wiki|TapTap/u);
  await expect(imageSources).toContainText("Petit Planet Wiki");
  await expect(imageSources).toContainText("TapTap 作者「阿Zz」");
  await expect(thanks).toContainText("小铭同学qaQ233、明天攻略组");
  await expect(thanks).toContainText("Petit Planet Wiki 社区");
  await expect(thanks).toContainText("作者「阿Zz」");
  const latestImage = page.getByRole("link", { name: "查看小铭同学qaQ233图鉴（9月30日）" });
  await expect(latestImage).toHaveAttribute("href", /xiaoming-09-30\.[\w-]+\.png$/u);
  const guideImage = latestImage.getByRole("img");
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(2);
  await expect
    .poll(() => guideImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBe(1280);
  await expect(page.getByRole("main")).not.toContainText(/2026-09-23|历史资料|如何阅读这些记录/u);
  const latestImageResponse = await page.request.get((await latestImage.getAttribute("href"))!);
  expect(latestImageResponse.status()).toBe(200);
  expect(latestImageResponse.headers()["content-type"]).toContain("image/png");
  const tomorrowImageLink = page.getByRole("link", { name: "查看明天攻略组图鉴（2026-09-24）" });
  await expect(tomorrowImageLink).toHaveAttribute("href", /tomorrow-2026-09-24\.[\w-]+\.jpg$/u);
  const tomorrowImage = tomorrowImageLink.getByRole("img", {
    name: "明天攻略组 星布谷地菜谱图鉴（2026-09-24）",
    exact: true,
  });
  await expect
    .poll(() => tomorrowImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBe(4355);
  const tomorrowImageResponse = await page.request.get(
    (await tomorrowImageLink.getAttribute("href"))!,
  );
  expect(tomorrowImageResponse.status()).toBe(200);
  expect(tomorrowImageResponse.headers()["content-type"]).toContain("image/jpeg");
  await expect(page.locator("#tomorrow-20260924-image figcaption")).toContainText(
    "明天攻略组 · 图片日期 2026-09-24",
  );
  const referenceImage = page.getByRole("link", { name: "查看小铭同学qaQ233图鉴（9月30日）" });
  await expect(referenceImage).toHaveAttribute("href", /xiaoming-09-30\.[\w-]+\.png$/u);
  await expect
    .poll(() =>
      referenceImage.getByRole("img").evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(1280);
  const referenceImageResponse = await page.request.get(
    (await referenceImage.getAttribute("href"))!,
  );
  expect(referenceImageResponse.status()).toBe(200);
  expect(referenceImageResponse.headers()["content-type"]).toContain("image/png");
  await expect(page.locator("#xiaoming-0930-image figcaption")).toContainText(
    "小铭同学qaQ233 · 图片日期 9月30日",
  );
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
  await page
    .getByRole("main")
    .getByRole("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  await page.screenshot({
    path: testInfo.outputPath("about-two-guides-mobile.png"),
    fullPage: true,
  });
  await navigation.getByRole("link", { name: "菜谱", exact: true }).click();
  await page.getByRole("button", { name: "查看和煦花果茶配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).not.toContainText("明天攻略组");
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await navigation.getByRole("link", { name: "关于", exact: true }).click();
  await expect(page).toHaveURL(/\/about\/?$/u);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(guideImage).toBeVisible();
  await expect(tomorrowImage).toBeVisible();
  await expect(referenceImage).toBeVisible();
});
