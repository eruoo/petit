import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// PNG favicons are fallbacks for browsers without SVG icon support; they are rendered
// from the same brand mark so every icon keeps identical artwork and accents.
const artwork = await readFile(new URL("../public/brand-mark.svg", import.meta.url));
const sizes = [16, 32];
const browser = await chromium.launch();

try {
  for (const size of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!doctype html>
<html>
<head>
  <style>
    html, body { margin: 0; background: transparent; }
    img { display: block; }
  </style>
</head>
<body>
  <img src="data:image/svg+xml;base64,${artwork.toString("base64")}" width="${size}" height="${size}" alt="">
</body>
</html>`);
    await page.evaluate(() => Promise.all(Array.from(document.images, (image) => image.decode())));
    await page.screenshot({
      path: fileURLToPath(new URL(`../public/favicon-${size}.png`, import.meta.url)),
      type: "png",
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
