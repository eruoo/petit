import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { siteMetadata } from "../shared/site.ts";

const artwork = await readFile(new URL("../public/brand-mark.svg", import.meta.url));
const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: siteMetadata.image.width, height: siteMetadata.image.height },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #fff8e9;
      color: #57452f;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    main { position: relative; height: 100%; padding: 78px 80px; }
    .copy { position: relative; z-index: 1; }
    .eyebrow { margin: 0 0 30px; font-size: 24px; letter-spacing: 4px; color: #866b48; }
    h1 { margin: 0; font-size: 112px; font-weight: 750; line-height: 1; letter-spacing: -5px; }
    .dot { color: #ad7934; }
    h2 { margin: 28px 0 22px; font-size: 42px; font-weight: 650; letter-spacing: 1px; }
    .description { margin: 0; font-size: 25px; line-height: 1.7; color: #806b52; }
    .note { position: absolute; left: 80px; bottom: 58px; margin: 0; font-size: 19px; color: #8e7b61; }
    img { position: absolute; top: 125px; right: 110px; width: 380px; height: 380px; }
  </style>
</head>
<body>
  <main>
    <div class="copy">
      <p class="eyebrow">非官方资料站</p>
      <h1>${siteMetadata.name}<span class="dot">.</span></h1>
      <h2>星布谷地资料手册</h2>
      <p class="description">目前提供菜谱速查<br>按菜名、食材、词条与烹饪方式查找配方</p>
    </div>
    <img src="data:image/svg+xml;base64,${artwork.toString("base64")}" alt="">
    <p class="note">查阅配方，从这里开始。</p>
  </main>
</body>
</html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  await page.screenshot({
    path: fileURLToPath(new URL("../public/og-image.png", import.meta.url)),
    type: "png",
  });
} finally {
  await browser.close();
}
