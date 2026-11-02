import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { recipeDataset } from "../../shared/recipes/index";
import { currentRecipes } from "../../shared/recipes/current";
import { recipeImages, recipeImagesById, recipeImageSchema } from "../../shared/recipes/images";
import wiki from "../../docs/references/recipes/wiki-dish-icons-2026-09-26.json";
import wikiSupplement from "../../docs/references/recipes/wiki-dish-icons-2026-10-01.json";
import wikiOctober4 from "../../docs/references/recipes/wiki-dish-icons-2026-10-04.json";
import wikiNovember1 from "../../docs/references/recipes/wiki-dish-icons-2026-11-01.json";
import taptap from "../../docs/references/recipes/taptap-recipe-guides-2026-09-26.json";

describe("菜品配图与独立来源", () => {
  it("111 条 Wiki 独立配图覆盖全部当前菜谱", () => {
    expect(recipeImagesById.size).toBe(111);
    expect(recipeDataset.recipes.every((recipe) => recipeImagesById.has(recipe.id))).toBe(true);
    expect([...recipeImagesById.keys()].sort()).toEqual(
      currentRecipes.map((recipe) => recipe.id).sort(),
    );
    expect(recipeImages.every((image) => image.provider === "wiki")).toBe(true);
    expect(recipeImages.every((image) => image.displayRegion === undefined)).toBe(true);
    expect(recipeImages.every((image) => !image.gameVerified)).toBe(true);
  });

  it("补图与替换采用独立 Wiki 原图，旧攻略区域保留归档", () => {
    for (const [recipeId, fileId, guideNameRaw, status] of [
      ["mt-20260924-simple-019", "9299", "胡萝卜炖肉", "visual-candidate"],
      ["mt-20260924-signature-025", "9317", "蒜香流心奶面包", "name-variant-visual-candidate"],
      ["mt-20260924-guest-004", "9358", "梦幻金玉满堂饭", "visual-candidate"],
      ["mt-20260924-guest-012", "9401", "梦幻草莓奶蛋糕", "visual-candidate"],
      ["mt-20260924-signature-004", "9439", "茄茄擂辣饭", "visual-candidate"],
      ["mt-20260929-neighbor-009", "4014", undefined, "english-entry-candidate"],
      ["xm-0927-neighbor-006", "9450", undefined, "english-entry-candidate"],
      ["mt-20260929-miracle-007", "9483", "奇迹盛宴畅饮桶", "visual-candidate"],
      ["mt-20260929-miracle-001", "10671", "奇迹盛宴大锅炖", "visual-candidate"],
      ["mt-20260929-miracle-002", "9548", "奇迹盛宴大烤串", "visual-candidate"],
      ["mt-20260929-miracle-003", "9596", "奇迹盛宴丰年饭", "visual-candidate"],
      ["mt-20260929-miracle-004", "9598", "奇迹盛宴极火炒", "visual-candidate"],
      ["mt-20260929-miracle-005", "9546", "奇迹盛宴甜点塔", "visual-candidate"],
      ["mt-20260929-miracle-006", "9600", "奇迹盛宴瓦罐汤", "visual-candidate"],
      ["mt-20260929-miracle-008", "10672", "奇迹盛宴炸串碗", "visual-candidate"],
      ["mt-20260924-guest-013", "9542", "梦幻星莓漫游派", "visual-candidate"],
      ["mt-20260924-guest-014", "9544", "梦幻番茄汤汁面", "visual-candidate"],
    ] as const) {
      const image = recipeImagesById.get(recipeId);
      expect(image).toMatchObject({
        provider: "wiki",
        assetId: `petitplanet-wiki-file-${fileId}`,
        width: 512,
        height: 512,
        guideNameRaw,
        status,
        gameVerified: false,
      });
      expect(image?.displayRegion).toBeUndefined();
    }
    expect(wikiNovember1.unmatchedRecipeIds).toEqual([]);
    expect(taptap.files).toHaveLength(6);
    expect(new Set(taptap.files.map((file) => file.localPath)).size).toBe(6);
    expect(taptap.files.flatMap((file) => file.targetRecipes)).toHaveLength(7);
    expect(taptap.totalBytes).toBe(taptap.files.reduce((sum, file) => sum + file.bytes, 0));
  });

  it("显示文件均可追溯到归档原文件，文件内容未被裁切或覆盖", () => {
    const files = new Map(
      [
        ...wiki.files,
        ...wikiSupplement.files,
        ...wikiOctober4.files,
        ...wikiNovember1.files,
        ...taptap.files,
      ].map((file) => [file.id, file]),
    );
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
    const file = taptap.files.find((entry) => entry.id === "taptap-852582459005469363-guest-2")!;
    const image = {
      ...recipeImagesById.get("mt-20260924-guest-013")!,
      assetId: file.id,
      localPath: file.localPath,
      width: file.width,
      height: file.height,
      provider: "taptap",
      sourceUrl: file.postUrl,
      displayRegion: file.targetRecipes[0]!.displayRegion,
    };
    expect(image.displayRegion).toEqual({ x: 90, y: 197, width: 150, height: 150 });
    expect(recipeImageSchema.safeParse(image).success).toBe(true);
    expect(recipeImageSchema.safeParse({ ...image, displayRegion: undefined }).success).toBe(false);
    expect(
      recipeImageSchema.safeParse({
        ...image,
        displayRegion: { x: 1000, y: 749, width: 150, height: 150 },
      }).success,
    ).toBe(false);
    expect(
      recipeImageSchema.safeParse({
        ...image,
        displayRegion: { x: 90, y: 749, width: 0, height: 150 },
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
