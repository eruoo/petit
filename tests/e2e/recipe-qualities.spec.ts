import { expect, test } from "@playwright/test";

test("同图什锦饮以品质底色和文字区分，未知品质保持待确认", async ({ page }) => {
  await page.goto("/?q=什锦饮");
  const results = page.getByRole("list", { name: "菜谱结果" });
  await expect(results.getByRole("button")).toHaveCount(3);
  const backgrounds = new Set<string>();
  for (const [name, label] of [
    ["家常什锦饮", "蓝色品质"],
    ["珍稀什锦饮", "紫色品质"],
    ["梦幻什锦饮", "金色品质"],
  ] as const) {
    const row = results.getByRole("button", { name: `查看${name}配方`, exact: true });
    await expect(row.getByText(label, { exact: true })).toBeVisible();
    backgrounds.add(
      await row
        .locator(".recipe-image")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    );
  }
  expect(backgrounds.size).toBe(3);
  await results.getByRole("button", { name: "查看珍稀什锦饮配方", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("紫色品质", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("甜饼果茶");
  const unknown = results.getByRole("button", { name: "查看甜饼果茶配方", exact: true });
  await expect(unknown.getByText("品质待确认", { exact: true })).toBeVisible();
  await unknown.click();
  await expect(dialog.getByText("品质待确认", { exact: true })).toBeVisible();
});

test("手机详情显示新版品质和食材，不附来源核对面板", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=梦幻海岸虾鱼筵");
  const trigger = page.getByRole("button", { name: "查看梦幻海岸虾鱼筵配方", exact: true });
  await expect(trigger.getByText("金色品质", { exact: true })).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("金色品质", { exact: true })).toBeVisible();
  await expect(dialog.getByText("虾类", { exact: true })).toBeVisible();
  await expect(dialog.getByText("待确认", { exact: true })).toHaveCount(0);
  await expect(dialog).not.toContainText(/来源|品质依据|核对/u);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
