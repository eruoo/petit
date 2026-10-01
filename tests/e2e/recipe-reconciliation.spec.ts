import { expect, test } from "@playwright/test";

test("详情保留食材与增益，不展示来源、核对或依据截图", async ({ page }, testInfo) => {
  await page.goto("/?q=谷物粥");
  await page.getByRole("button", { name: "查看谷物粥配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const effect = dialog.locator(".effect-detail");
  await expect(effect).toContainText("6 次内有效");
  await expect(effect).toContainText("单次伐木或挖矿");
  await expect(effect).not.toContainText("6 秒");
  await expect(dialog).not.toContainText(
    /配方来源|核对|原图颜色与加粗|配图来源|品质依据|图鉴对照|增益说明依据/u,
  );
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await expect(effect.getByRole("img")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("recipe-details-desktop.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("梦幻草莓奶蛋糕");
  await page.getByRole("button", { name: "查看梦幻草莓奶蛋糕配方", exact: true }).click();
  await expect(
    dialog.getByRole("list", { name: "有序食材" }).getByText("奶", { exact: true }),
  ).toHaveCount(2);
  await expect(dialog).not.toContainText("火龙果");
  const cakeSlots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(cakeSlots.nth(3)).toContainText(/草莓\s*需金色品质/u);
  await expect(cakeSlots.nth(0)).not.toContainText("品质");
  await expect(effect).not.toContainText("15 次内有效");
  await expect(effect).toContainText("可能获得增益");
  await expect(dialog).not.toContainText(/核对|图鉴对照/u);
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("和煦花果茶");
  await page.getByRole("button", { name: "列表视图", exact: true }).click();
  const plainRecipe = page.getByRole("button", { name: "查看和煦花果茶配方", exact: true });
  await expect(plainRecipe).toContainText("无特殊效果");
  await plainRecipe.click();
  await expect(effect).toContainText("无特殊效果");
  await expect(effect).not.toContainText("未说明");
});

test("手机展示当前配方与增益时长，详情没有来源面板", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=梦幻鱼鲜寿司");
  await page.getByRole("button", { name: "查看梦幻鱼鲜寿司配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const effect = dialog.locator(".effect-detail");
  await expect(effect).toContainText("60 秒");
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await expect(dialog).not.toContainText(/核对|来源|依据/u);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await effect.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("recipe-details-mobile.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("花香蜜瓜派");
  await page.getByRole("button", { name: "查看花香蜜瓜派配方", exact: true }).click();
  await expect(dialog.locator(".recipe-facts")).toContainText("煮锅");
  await expect(dialog).toContainText("大力播洒 · 一阶");
  await expect(effect).toContainText("10 秒");
  await expect(dialog).not.toContainText(/图鉴对照|烤箱/u);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("秘制菜显示配图和当前力气与效果", async ({ page }) => {
  await page.goto("/?q=卡拉红汁炖肉");
  const trigger = page.getByRole("button", { name: "查看卡拉红汁炖肉配方", exact: true });
  await expect(
    trigger.getByRole("img", { name: "卡拉红汁炖肉（候选配图）", exact: true }),
  ).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("配方获取：哈佩诺");
  await expect(dialog.locator(".recipe-facts")).toContainText("+90");
  await expect(dialog.locator(".recipe-facts")).not.toContainText("+0");
  await expect(dialog.locator(".effect-detail")).toContainText("快速翻土 · 二阶");
  await expect(dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem")).toHaveCount(2);
});

test("外婆菜饭采用去问号的金色谷物，新菜空配方保留未说明", async ({ page }) => {
  await page.goto("/?q=外婆菜饭");
  await page.getByRole("button", { name: "查看外婆菜饭配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const slots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(slots.nth(3)).toContainText(/谷物\s*需金色品质/u);
  await expect(slots.nth(3)).not.toContainText(/\?|待确认/u);
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("轰炸大菇肉");
  await page.getByRole("button", { name: "查看轰炸大菇肉配方", exact: true }).click();
  await expect(dialog).toContainText("食材未说明");
  await expect(dialog).not.toContainText("0 个食材槽位");
  await expect(dialog.locator(".recipe-facts")).toContainText("未知");
  await expect(dialog.locator(".effect-detail")).toContainText("未说明");
  await expect(dialog.locator(".effect-detail")).not.toContainText("无特殊效果");
});
