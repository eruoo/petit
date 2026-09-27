import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import { recipeImages, recipeImagesById, recipeImageSchema } from "../../shared/recipes/images";
import wiki from "../../docs/references/recipes/wiki-dish-icons-2026-09-26.json";
import taptap from "../../docs/references/recipes/taptap-recipe-guides-2026-09-26.json";

describe("菜品配图与独立来源", () => {
  it("90 条既有菜谱沿用候选配图，新增四条使用同名攻略图", () => {
    expect(recipeImagesById.size).toBe(94);
    expect([...recipeImagesById.keys()].sort()).toEqual(
      recipeDataset.recipes.map((recipe) => recipe.id).sort(),
    );
    expect(recipeImages.filter((image) => image.provider === "wiki")).toHaveLength(87);
    expect(
      recipeImages.filter((image) => image.provider === "taptap").map((image) => image.recipeId),
    ).toEqual([
      "mt-20260924-simple-019",
      "mt-20260924-signature-004",
      "mt-20260924-signature-025",
      "mt-20260924-guest-004",
      "mt-20260924-guest-012",
      "mt-20260924-guest-013",
      "mt-20260924-guest-014",
    ]);
    expect(recipeImages.every((image) => !image.gameVerified)).toBe(true);
  });

  it("新增四菜按原图行定位，同一原图中的两道菜保留各自区域", () => {
    const targets = [
      { id: "004", name: "梦幻金玉满堂饭", image: 2, row: 5, y: 932 },
      { id: "012", name: "梦幻草莓奶蛋糕", image: 1, row: 6, y: 1115 },
      { id: "013", name: "梦幻星莓漫游派", image: 2, row: 1, y: 197 },
      { id: "014", name: "梦幻番茄汤汁面", image: 3, row: 2, y: 380 },
    ];
    for (const target of targets) {
      expect(recipeImagesById.get(`mt-20260924-guest-${target.id}`)).toMatchObject({
        assetId: `taptap-852582459005469363-guest-${target.image}`,
        guideNameRaw: target.name,
        sourceUrl: "https://www.taptap.cn/moment/852582459005469363",
        sourceLocation: `宴客菜第 ${target.image} 张 · 第 ${target.row} 行`,
        displayRegion: { x: 90, y: target.y, width: 150, height: 150 },
        status: "same-name-image-candidate",
        gameVerified: false,
      });
    }
    expect(taptap.files).toHaveLength(6);
    expect(new Set(taptap.files.map((file) => file.localPath)).size).toBe(6);
    expect(taptap.files.flatMap((file) => file.targetRecipes)).toHaveLength(7);
    expect(taptap.totalBytes).toBe(taptap.files.reduce((sum, file) => sum + file.bytes, 0));
  });

  it("显示文件均可追溯到归档原文件，文件内容未被裁切或覆盖", () => {
    const files = new Map([...wiki.files, ...taptap.files].map((file) => [file.id, file]));
    for (const image of recipeImages) {
      const file = files.get(image.assetId);
      expect(file, image.assetId).toBeDefined();
      expect(image.localPath).toBe(file!.localPath);
      const bytes = readFileSync(new URL(`../../${image.localPath}`, import.meta.url));
      expect(bytes.length).toBe(file!.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file!.sha256);
      expect(new URL(image.sourceUrl).hostname).toBe(
        image.provider === "wiki" ? "petitplanet.wiki" : "www.taptap.cn",
      );
    }
  });

  it("攻略图须有有效的显示区域，越界或缺失区域不能进入页面", () => {
    const image = recipeImagesById.get("mt-20260924-signature-025")!;
    expect(image.displayRegion).toEqual({ x: 90, y: 932, width: 150, height: 150 });
    expect(recipeImageSchema.safeParse({ ...image, displayRegion: undefined }).success).toBe(false);
    expect(
      recipeImageSchema.safeParse({
        ...image,
        displayRegion: { x: 1000, y: 932, width: 150, height: 150 },
      }).success,
    ).toBe(false);
    expect(
      recipeImageSchema.safeParse({
        ...image,
        displayRegion: { x: 90, y: 932, width: 0, height: 150 },
      }).success,
    ).toBe(false);
  });

  it("异名、共用图形与英文条目保留候选语义和差异说明", () => {
    expect(recipeImagesById.get("mt-20260924-simple-008")).toMatchObject({
      status: "name-variant-visual-candidate",
      guideNameRaw: "暖暖阳春面",
      gameVerified: false,
    });
    expect(recipeImagesById.get("mt-20260924-signature-017")).toMatchObject({
      status: "shared-art-candidate",
    });
    const neighbor = recipeImagesById.get("mt-20260924-neighbor-001")!;
    expect(neighbor.status).toBe("english-entry-candidate");
    expect(neighbor.notes.join(" ")).toContain("Wiki 力气为 70，附件为 60");
    expect(recipeImageSchema.safeParse({ ...neighbor, gameVerified: true }).success).toBe(false);
  });
});
