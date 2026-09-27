import { expect, test } from "@playwright/test";

test("列表与详情显示具体食材的品质要求，重复槽位和候选文字独立保留", async ({ page }) => {
  await page.goto("/?q=美味");
  await page.getByRole("button", { name: "列表视图", exact: true }).click();
  const pizza = page.getByRole("button", { name: "查看美味海风披萨配方", exact: true });
  await expect(
    pizza.getByRole("list", { name: "有序食材" }).getByRole("listitem").nth(2),
  ).toContainText(/小麦\s*需紫色品质/u);
  await pizza.click();
  const dialog = page.getByRole("dialog");
  const slots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(slots).toHaveCount(3);
  await expect(slots.nth(1)).not.toContainText("品质");
  await expect(slots.nth(2).locator("[data-quality=purple]")).toContainText("小麦");
  await page.keyboard.press("Escape");
  const search = page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true });
  await search.fill("水果烤虾拼盘");
  const shrimp = page.getByRole("button", { name: "查看水果烤虾拼盘配方", exact: true });
  const repeated = shrimp.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(repeated).toHaveCount(3);
  await expect(repeated.nth(0)).toContainText(/虾类\s*需紫色品质/u);
  await expect(repeated.nth(1)).toHaveText("虾类");
  await search.fill("茄茄");
  await page.getByRole("button", { name: "查看茄茄擂辣饭配方", exact: true }).click();
  await expect(slots.nth(0)).toContainText("茄子");
  await expect(slots.nth(0)).toContainText("需紫色品质");
  await expect(slots.nth(0)).not.toContainText("待确认");
  await expect(slots.nth(0)).not.toContainText("?");
  await page.keyboard.press("Escape");
  await search.fill("漫香果麦奶");
  await page.getByRole("button", { name: "查看漫香果麦奶配方", exact: true }).click();
  await expect(slots.nth(2)).toContainText("水果");
  await expect(slots.nth(2)).not.toContainText("待确认");
  await expect(slots.nth(1)).not.toContainText("待确认");
});

test("手机四槽食材品质与补全食材不会溢出或混成菜品品质", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?q=时蔬烧烤派对");
  await page.getByRole("button", { name: "列表视图", exact: true }).click();
  const party = page.getByRole("button", { name: "查看时蔬烧烤派对配方", exact: true });
  await expect(party.getByText("需紫色品质", { exact: true })).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await party.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("需紫色品质", { exact: true })).toHaveCount(4);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索菜名、食材、词条或烹饪方式", { exact: true }).fill("梦幻番茄汤汁面");
  await page.getByRole("button", { name: "查看梦幻番茄汤汁面配方", exact: true }).click();
  const slots = dialog.getByRole("list", { name: "有序食材" }).getByRole("listitem");
  await expect(slots).toHaveCount(4);
  await expect(slots.nth(0)).toContainText(/番茄\s*需金色品质/u);
  await expect(slots.nth(1)).not.toContainText("品质");
  await expect(slots.nth(2)).toContainText("大蒜");
  await expect(slots.nth(2)).not.toContainText("品质");
  await expect(slots.nth(3)).toContainText("?");
  await expect(slots.nth(3)).toContainText("未知");
});
