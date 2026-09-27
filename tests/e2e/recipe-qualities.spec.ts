import { expect, test } from "@playwright/test";

test("同图什锦饮以品质底色和文字区分，详情保留可追溯依据", async ({ page }) => {
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
  const source = dialog.getByRole("region", { name: "品质依据" });
  await expect(source).toContainText("简单菜第 6 张 · 第 5 行");
  await expect(source).toContainText("紫色圆底");
  await expect(source.getByRole("link", { name: "品质来源原帖" })).toHaveAttribute(
    "href",
    "https://www.taptap.cn/moment/851862566224266917",
  );
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名或食材", { exact: true }).fill("竹香苹果冰");
  const unknown = results.getByRole("button", { name: "查看竹香苹果冰配方", exact: true });
  await expect(unknown.getByText("品质待确认", { exact: true })).toBeVisible();
  await unknown.click();
  await expect(dialog.getByRole("region", { name: "品质依据" })).toContainText(
    "不能提供品质底色依据",
  );
  await expect(dialog.getByRole("link", { name: "查看品质原图" })).not.toBeAttached();
});

test("手机品质候选与关于页说明可访问，不将异名对应标成已验证", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=暖暖阳汤面");
  const trigger = page.getByRole("button", { name: "查看暖暖阳汤面配方", exact: true });
  await expect(trigger.getByText("蓝色品质（候选）", { exact: true })).toBeVisible();
  await trigger.click();
  const source = page.getByRole("dialog").getByRole("region", { name: "品质依据" });
  await expect(source).toContainText("暖暖阳春面");
  await expect(source).toContainText("菜品对应仍待核对");
  await source.getByRole("link", { name: "查看品质说明" }).click();
  await expect(page).toHaveURL(/\/about\/?#dish-quality$/u);
  await expect(page.locator("#dish-quality")).toBeInViewport();
  await expect(page.locator("#dish-quality")).toContainText("品质颜色参考 TapTap 图鉴");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
