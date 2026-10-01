# 小星球品牌素材

当前品牌图标是 2026-10-01 重新设计的扁平矢量小星球。唯一源文件为 `public/brand-mark.svg`：页眉和 SVG favicon 直接引用它，16／32 px PNG favicon 与分享图由它导出。站点定位与使用方式见[页面约定](../../specs/recipe-browser.md#站点定位与标识)。

## 当前矢量星球图标

图标是一颗居中的完整圆形星球，透明背景，没有卫星、描边或高光条。256 × 256 画布中星球半径 108，四周各留 20（约 7.8%）。

| 元素     | 设计                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| 草地     | 上半部，草绿渐变 `#8fe070` → `#5cc457`；3 个大小不同的凹陷陨石坑（`#43a246` 外圈、`#58bd52` 内圈） |
| 河流     | 接近居中的波浪分界，亮蓝 `#3aaaf2` 实色，不加反光或河岸线                                          |
| 地面     | 下半部，暖黄渐变 `#ffd765` → `#ffb93a`，承接蛋糕／曲奇意象                                         |
| 曲奇点缀 | 3 颗高低错落、角度各异的巧克力豆（`#d9822e`），带右下投影 `#a95c1c` 与左上小亮面 `#f4b066`         |
| 光照     | 草地与地面共用同一左上方向的渐变，边缘叠加 `#2c3570` 最高 20% 的球面阴影                           |

设计过程中用户确认的取舍：

- 最初的“放大镜观测星球”意向（镜片框住星球、星球旁放大镜、透视观察等构图）经多轮草稿后放弃，改为最简洁的单一星球。
- 配色要求明亮活泼；曲奇只作点缀，不用棕色大面积铺满地面；草地与河流的色相差约 90°，避免小尺寸下混在一起。
- 去掉右上卫星、星球高光、河流反光、深蓝河岸线，以及草簇、小花、糖粒等零碎装饰，只保留陨石坑与巧克力豆两组点缀；两组点缀按不等边三角形零散排布，避开河流与边缘。
- 所有图标保持统一点缀，不另做去点缀的小尺寸版本。16 px 下点缀只剩 1～2 个像素，接受这一取舍以保持各处图标一致。

| 文件                    | 尺寸              | 用途                                                 |
| ----------------------- | ----------------- | ---------------------------------------------------- |
| `public/brand-mark.svg` | viewBox 256 × 256 | 源文件；页眉（桌面 44 px、手机 38 px）与 SVG favicon |
| `public/favicon-32.png` | 32 × 32           | 不支持 SVG 图标时的回退 favicon，由源文件导出        |
| `public/favicon-16.png` | 16 × 16           | 同上                                                 |

修改源文件后运行 `pnpm brand:favicons` 重新导出 PNG favicon，运行 `pnpm brand:og-image` 重新生成分享图。`scripts/generate-favicons.ts` 用 Playwright Chromium 以透明背景按 1× 像素密度截图。SVG 内的 `planet`、`grass`、`ground`、`shade` 是通用 ID，目前只通过 `<img>` 和图标链接引用，各自处于独立文档中；如需内联到页面，须先为这些 ID 加前缀，避免与页面元素冲突。

验证：2026-10-01 接入时，`pnpm brand:favicons` 与 `pnpm brand:og-image` 的输出和用户确认的预览逐像素一致，PNG favicon 四角为全透明；`pnpm check`、`pnpm build` 与 `pnpm test:e2e` 通过，静态产物中的图标与分享图和 `public/` 文件逐字节相同，首页 HTML 声明 SVG 与 16／32 px PNG 图标，页眉在桌面和手机宽度下加载 SVG。标签栏效果只在 Playwright Chromium 中模拟检查，尚未在 Chrome、Safari、Firefox 原生标签栏中确认各浏览器实际选用的图标。

## 分享图

`public/og-image.png` 是首页和关于页共用的 1200 × 630 静态分享图。奶油色背景承接站点配色，左侧为 Petit 名称、“星布谷地资料手册”和当前菜谱速查功能，右侧为 `public/brand-mark.svg` 渲染的 380 × 380 星球，垂直居中。

排版源为 `scripts/generate-og-image.ts`，使用 HTML/CSS 与 Playwright Chromium 截图，等待字体和图片解码后导出 PNG。运行 `pnpm brand:og-image` 可重新生成，普通静态构建直接复制公开资源。脚本读取 `shared/site.ts` 中的站点名称和图片尺寸，元数据使用同一处的图片路径、尺寸与替代文字。字体沿用系统中文字体，跨系统导出可能出现字形变化，需检查文字是否完整、图片是否裁切。图片与字段的接入约定见[页面元数据与分享预览](../../specs/recipe-browser.md#页面元数据与分享预览)。

## 历史版本：3D 蛋糕与苹果树星球

以下为 2026-09-28 至 2026-09-29 使用的 3D 图标记录，已被当前矢量星球图标替代。原图和提示词保留在本目录供追溯，不再进入公开静态资源目录；当时的页眉资源 `public/brand-mark.png` 已删除，可从 Git 历史查阅。

用户于 2026-09-28 要求将品牌图标改为以蛋糕为意象的 3D 小星球，并逐步加入草地、河流和奶油烟囱。2026-09-29 提供游戏场景截图后，要求将烟囱改为树，整张图按参考图重新设计；随后明确要求尽量保持完整球形、下半球采用与上半球相近的设计，并将树上果实改为苹果。该版本由内置 `image_gen` 以上一版果树星球和游戏截图为参考重新设计，采用透明背景。

苹果树版以完整球形地形为主体，嫩绿草坡、奶油色地层、灌木和花朵延伸至下半球，小瀑布连接前侧池塘。两棵高低苹果树采用圆润叠叶树冠，红苹果具有顶部凹口、果柄和叶片。奶油色崖面保留蛋糕地层意象，旧版深蓝底部与烟囱均已移除。参考截图来源为用户提供图片，接收日期不代表图片拍摄日期或游戏版本；该截图仅保存在本地资料目录。

| 文件                                         | 尺寸        | 用途                                     |
| -------------------------------------------- | ----------- | ---------------------------------------- |
| `cake-planet-original.png`                   | 1254 × 1254 | 初版原图，作为编辑输入保留               |
| `cake-planet-grass-river.png`                | 1254 × 1254 | 顶部局部编辑版，作为整体重设计参考保留   |
| `cake-planet-world.png`                      | 1254 × 1254 | 整体设计版，作为奶油烟囱编辑输入保留     |
| `cake-planet-cream-chimney.png`              | 1254 × 1254 | 圆柱烟囱版，作为方形烟囱编辑输入保留     |
| `cake-planet-square-chimney.png`             | 1254 × 1254 | 方柱烟囱版，作为游戏画风重绘的内容参考   |
| `cake-planet-style-reference-2026-09-29.png` | 502 × 587   | 用户提供的游戏场景截图，仅用于画风参考   |
| `cake-planet-soft-game.png`                  | 1254 × 1254 | 保留方形烟囱的旧版画风尝试               |
| `petit-planet-tree-world.png`                | 1254 × 1254 | 深蓝底部果树版，作为完整球形重设计的输入 |
| `petit-planet-apple-globe.png`               | 1254 × 1254 | 苹果树版主图，上下半球连续地形与红苹果树 |
| `petit-favicon-32-source.png`                | 1254 × 1254 | 苹果树版 16／32 px favicon 共用简化原图  |
| `petit-favicon-16-source.png`                | 1254 × 1254 | 未采用的紧凑尝试，树干消失使树形不完整   |

当时页眉资源由 `petit-planet-apple-globe.png` 等比例缩小为 192 × 192 PNG，16／32 px favicon 均由 `petit-favicon-32-source.png` 缩小到对应尺寸。

2026-09-29 独立评审二次核查后，用户授权保留当时的大图和页眉，优先简化 favicon。简化设计保留完整绿色球体、单棵苹果树、单个红苹果、奶油分界和蓝色水流。用户指出进一步压缩轮廓的 16 px 尝试丢失树形，因此该尝试仅作为历史记录保留。两份尝试均由内置 `image_gen` 编辑。新旧实际尺寸和浅色、奶油色、深色底对照见[对照图](favicon-comparison-2026-09-29.png)。

## 初版生成提示词

```text
Use case: stylized-concept
Asset type: transparent 3D website brand icon and favicon for Petit, a fan-made Petit Planet (星布谷地) reference site.
Primary request: A charming miniature CAKE PLANET, evoking the cozy, handcrafted small worlds of Petit Planet. Create an original cake-inspired little world, not a logo from the game.
Subject: One plump nearly spherical planet made of golden vanilla sponge cake. Its upper third is a softly domed cap of warm ivory whipped-cream frosting with three broad rounded drips. The rounded lower hemisphere clearly shows two thick golden sponge layers separated by one clean pale cream stripe, curved along the planet's spherical shape. A single large simple strawberry with two soft sage-green leaves sits on the upper surface as the main landmark. The world has a rounded spherical underside, with no cake plate or pedestal.
Style/medium: polished soft 3D game UI asset, tactile matte clay-like sponge and smooth frosting, softly bevelled edges, subtle ambient occlusion, gentle warm studio lighting from upper left, visible volume and contact shadows between the parts. Friendly and cozy, not photorealistic food, not flat vector.
Composition: square 1024x1024 transparent PNG, ONE centered isolated object in three-quarter view, camera slightly above eye level so the frosted top and curved cake layers are visible. Icon occupies about 88% of the canvas with balanced transparent margins. Strong clean silhouette, only a few broad forms; it must remain recognizable at 32 pixels.
Palette: honey gold sponge and warm cream frosting matching a cream/gold/brown website, small muted strawberry-red and sage-green accents. Enough golden shading around the silhouette to stay clear on a pale cream page.
Constraints: genuine transparent alpha background. No text, letters, wordmark, watermark, border, circular backdrop, orbital ring, stars, sparkles, particles, scenery, house, character, candles, stand, table, plate, cast shadow on an invisible floor, or tiny decorations. No deep slice cutout. It should read as a cake-shaped little planet rather than a conventional cylindrical birthday cake.
```

## 顶部局部编辑版提示词

输入图片：`cake-planet-original.png`。保留透明背景，由内置 `image_gen` 编辑。

```text
Use case: precise-object-edit.
Edit target: the supplied transparent 3D cake-planet brand icon for Petit.
Primary request: add gentle GRASSLAND and RIVER imagery to the top of this existing cake planet, turning its frosted top into a tiny cozy living world.
Change only the upper frosting surface: add two or three broad, rounded, soft sage-green meadow patches following the spherical curvature. Give the grass a smooth stylized 3D game texture with only a few restrained tufts. Add ONE clearly readable, gently winding turquoise-blue river through the grassy patches, as a broad simple S-shaped ribbon following the terrain. The river has softly rounded pale-cream banks and subtle glossy water highlights. Let the river meet the front edge with a small rounded blue spill that remains attached to the planet, not a long waterfall or floating drop. Keep some ivory frosting exposed between the meadow areas and preserve the recognizable broad frosting drips.
Preserve: the exact plump spherical cake silhouette, golden sponge layers, clean cream filling band, existing single strawberry and its leaves, warm soft upper-left lighting, polished 3D materials, three-quarter camera angle, centered framing and approximate object size. Keep the sponge lower hemisphere clearly visible. The strawberry remains a landmark on the grassy top.
Palette: warm ivory, honey-gold sponge, soft lively meadow green and clear turquoise water, with the existing strawberry-red accent. The green and blue should be distinct at tiny sizes.
Icon constraints: clean readable silhouette for a 32px favicon, few large color shapes, no tiny scenery, no trees, houses, people, animals, additional fruit, bridges, text, logo, ring, border, pedestal, ground plane or particles. Preserve genuine transparent alpha background. Only one isolated complete planet on a square canvas. Do not turn the cake into a normal flat-topped cylinder.
```

## 整体设计版提示词

参考图片：`cake-planet-grass-river.png`，提供意象和材质参考；球体结构与构图由内置 `image_gen` 重新设计。

```text
Use case: stylized-concept, complete 3D brand-icon redesign.
Input image role: concept and material reference ONLY. It shows the ingredients of the idea (cake, cream, grass, turquoise river, strawberry). The user wants the ENTIRE little planet redesigned as one coherent world. Do NOT preserve the previous top-decoration layout or the plain lower cake hemisphere.
Primary request: create one cohesive miniature CAKE WORLD, a truly spherical, charming habitable little planet where grassland, river, ivory cream and golden cake geology wrap naturally around the WHOLE visible globe.

Whole-object design:
- Use a round, nearly spherical silhouette and a three-quarter overhead view, fully visible, centered in a square.
- Build the globe from a small number of broad organic rounded terrain forms. Soft green grassy land covers the crown, the front face, both sides, and some of the lower curved rim. Distribute the landscape across the whole sphere, with visible topographic variety through the lower half.
- Golden vanilla sponge cake forms the exposed rounded cliffs and terraces between the grassy land masses on the front, side and lower hemisphere. Ivory cream is integrated as curved geological seams and soft pale riverbanks; vary their heights and curves so the cake structure follows the landscape. Retain enough golden cake and cream that the cake metaphor is immediately clear.
- One broad glossy turquoise-blue river winds from the upper left, through the center of the globe's visible front face, around a grassy ridge on the lower-right hemisphere, then broadens into a small curved lake nestled against the lower side. The water must visibly connect terrain from the crown to the side and lower hemisphere, following the sphere's curvature. It is real stylized terrain water, not a dribble of icing on top.
- A single SMALL strawberry can serve as a modest landmark tucked on one grassy slope, around one sixth of the globe diameter; it is secondary to the whole planet and must not dominate the top silhouette.
- Prefer three or four large grassy shapes, a clearly readable water ribbon, and a few exposed cake terraces. Avoid micro-detail and excessive individual grass blades.

Style: premium cozy stylized 3D game UI icon, softly rounded sculpted forms, tactile matte grassy surfaces, gently porous cake strata, velvety cream banks, subtly glossy water, soft upper-left lighting, gentle ambient occlusion, warm friendly color and convincing spherical volume.
Palette: meadow green, honey-gold sponge, warm ivory cream, bright clean turquoise water, restrained strawberry-red accent.
Framing: single isolated complete object, square transparent PNG, about 88% canvas occupancy with even transparent padding. Prioritize an iconic silhouette and large distinct color masses that work at 32px.
Critical exclusions: no conventional birthday cake with green decorations only on its top; no flat cake cap; no broad uninterrupted horizontal filling stripe around the equator; no huge featureless golden bottom half. No house, building, bridge, person, animals, additional fruit, plate, pedestal, floor, space backdrop, orbital rings, text, logo, border, floating particles or external shadow. Preserve a genuinely transparent alpha background.
This is a full composition redesign, not a localized edit.
```

## 奶油圆柱烟囱版提示词

输入图片：`cake-planet-world.png`。保留完整星球地形和透明背景，由内置 `image_gen` 增加顶部奶油烟囱。

```text
Edit the supplied transparent 3D cake-world icon. Preserve the existing whole round planet: grassy hills across the entire sphere, turquoise river and lake flowing over the visible front, tiny island, golden sponge-cake strata, ivory cream seams, small strawberry at upper right, lighting, texture, friendly stylization, and transparent background.

Add exactly ONE upright chimney-shaped column made entirely of ivory whipped cream on the rear upper grassy plateau, slightly to the right of the river's upper source and to the left of the strawberry. Place it as a clear, charming landmark that rises above the globe's silhouette. Make the column roughly 18–22% of the planet diameter tall and 10–12% wide. It is a mostly straight, softly rounded cylindrical chimney with a thick rounded cream rim and a clearly visible small elliptical hollow opening at its top, with a soft warm shadow inside. The column stands vertically upward and has subtle soft creamy surface grooves, with a small natural cream base joining the surrounding grassy cake terrain. Keep it organic, delicious, and integrated into this little world, with the same gentle 3D rendering and upper-left lighting. It must read as a cream chimney, not a pointed whipped-cream swirl or a candle: no wick, flame, smoke, bricks, house, or other new objects. Do not obstruct the river, lake, or strawberry. Keep every existing part of the planet intact as much as possible. Show the whole new object uncropped, with comfortable balanced transparent margins. No text, no background, no plate, no pedestal. Deliver one square transparent PNG icon.
```

## 方形奶油烟囱版提示词

输入图片：`cake-planet-cream-chimney.png`。保留原有构图，由内置 `image_gen` 将奶油烟囱改为方形。

```text
Precisely edit the supplied transparent 3D cake-planet brand icon. Change ONLY the existing upright ivory cream chimney on the upper rear grassy plateau from a round cylinder into a SQUARE-CROSS-SECTION cream chimney.

Keep its exact location between the upper river and the strawberry, approximate height and width, and creamy ivory material. Give it four straight upright flat faces, lightly softened beveled corners, a clearly square thick top rim, and a square hollow opening with warm soft interior shadow, seen in the same three-quarter perspective. Its opening and body must unmistakably be square, not round or oval. Its creamy walls should be smooth, without the cylindrical spiral grooves from the previous version. Add only a modest softened square cream foot blending into its existing base. This is still soft edible cream, not brick or metal. Keep the chimney upright, with no smoke, fire, wick, roof, or additional decorations.

Preserve the entire globe's rounded silhouette, grass terrain, river path and blue lake, tiny lake island, sponge-cake cliffs, ivory cream seams, strawberry, grass tufts, lighting, camera, framing and transparency. Do not make the planet itself square. Keep the image otherwise visually identical. One isolated complete object, square PNG, fully visible with transparent background.
```

## 保留烟囱的游戏画风版提示词

输入顺序：`cake-planet-style-reference-2026-09-29.png` 为画风参考，`cake-planet-square-chimney.png` 为内容参考。由内置 `image_gen` 重绘，保留透明背景。

```text
Create a newly restyled version of this cake-planet website brand icon using TWO supplied images.

IMAGE 1, the user's in-game landscape screenshot, is the PRIMARY ART-DIRECTION reference: match its cozy stylized game-world rendering, broad squishy rounded terrain, luminous fresh mint/lime grass, subtly mottled hand-painted surfaces, soft simplified shapes and cool blue-green ambient shadows. Its grass looks like a plush green frosting blanket with rounded scalloped edges. It is charming, airy, gentle, and readable rather than a high-gloss product render.

IMAGE 2, the current transparent cake planet, is the CONTENT AND IDENTITY reference: keep a complete rounded little spherical cake-world with grassy terrain wrapping the whole globe, a turquoise winding river and small lake on the visible face, warm pale sponge-cake strata and ivory cream seams, one little strawberry, and ONE upright SQUARE cream chimney at the upper rear. Preserve the square cross section, square hollow opening and softly rounded corners of the chimney, and its placement beside the river. This is still a cake-inspired planet, not a normal birthday cake.

Restyle the WHOLE object, not just its top. Substantially simplify the busy previous design: use a few broad tiered grassy landforms, smoother pale golden cake cliffs with only very subtle painted texture instead of dense realistic pores, and soft matte cream banks. Remove the many pointed grass-blade clumps and all photorealistic food detail. Make the grass tender bright mint-green and lime-green, with sparse tiny pale flecks like the reference screenshot, not olive moss. Keep the water a simple calm turquoise ribbon with very restrained soft highlights, not glossy candy syrup. Use a little desaturated periwinkle-blue shadow toward the lower hemisphere, gently connecting with the screenshot's palette while keeping visible golden cake and cream layers. The strawberry should be a small, softly rounded simplified coral-red accent with broad mint-green leaves. Include two small rounded scalloped foliage clumps on the grassy slopes, echoing the soft leaf masses in image 1 without adding trees taller than the chimney or cluttering the silhouette. Do not reproduce the screenshot's exact island, blue crystal or objects.

Use the reference screenshot's softer stylized game shading, low-frequency hand-painted texture, broad ambient light and subtle gentle rim illumination. Avoid a glossy clay collectible or realistic bakery-advertisement look. Strong simple color masses and a friendly cohesive silhouette for a website icon.

Deliver one complete isolated object in a square transparent PNG, three-quarter view from slightly above, visually centered with at least 6% clear padding on every side including above the chimney. Make the globe feel round and compact, not flattened. No scenic sea, sky, dark background, floating sparks, stars, external glow cloud, outer shadow, text, watermark, plate or pedestal. Genuine alpha transparency.
```

## 深蓝底部果树小星球整体设计提示词

唯一视觉参考：`cake-planet-style-reference-2026-09-29.png`。由内置 `image_gen` 整体重新设计，保留透明背景。

```text
Use the supplied GAME SCREENSHOT as the sole visual reference. Design an entirely NEW miniature world icon for Petit in this screenshot's actual visual style. This is a complete redesign of the whole terrain, composition, silhouette, materials, vegetation and water, NOT a local object swap and NOT a recoloring of an old cake icon.

The reference shows a cozy little game island with thick luminous spring-green meadows, softly scalloped grassy edges, pale warm cream cliffs, a deep blue rounded planetary base, and fruit trees with many overlapping broad round leaf lobes. Recreate these design characteristics closely. Match the reference's stylized hand-painted game rendering: diffuse glowing green surfaces, softly mottled color, simple friendly geometry, warm light and gentle blue shadows. Favor medium-saturation emerald/mint grass over bleached pastel frosting. No photorealistic sponge pores, glossy candy finish, intricate food texture, or plastic toy presentation.

NEW composition for one isolated miniature round island-world:
- A compact, broad, organically rounded globe/island body, seen slightly from above in three-quarter view, with a LOW raised meadow at the rear left and a LOWER wide curved meadow at the front right. The whole body is naturally uneven rather than a perfectly smooth ball, and visibly has depth and a round underside.
- Build just TWO broad grassy terraces with soft scalloped edges. Between them expose a slim warm cream-and-pale-gold terrain layer, subtly suggesting cake and cream as geology, not a literal multi-layer pastry. The lower hemisphere is a rounded muted deep periwinkle/indigo-blue base as in the reference, softly shaded, with subtle broad surface patches. Do not stack many cake rings or fill the whole globe with pastry bands.
- The primary upper landmark is ONE friendly fruit TREE on the raised rear-left meadow. It has a short visible warm pale-yellow natural trunk, a broad round green canopy made from overlapping scalloped leaf lobes, and three modest coral-orange round fruits. The main tree is substantial, about one-third the body width, with a silhouette like the trees in the reference. A second smaller matching fruit tree sits on the right meadow, balancing the composition. One tiny rounded bush may sit at the left lower edge.
- A restrained narrow turquoise creek travels through the gap BETWEEN the two terraces from rear center toward front right, and ends in a small inset blue pool at the edge. It follows the new low terrain layout. Water takes a secondary role; do NOT use a giant bright S-ribbon covering the entire front hemisphere. Matte simple water with a couple of soft highlights.
- A few tiny painted cream flower dots, including one simple white flower on the foreground meadow, reinforce the reference's pleasant game terrain. Sparse details, no decorative clutter.
- The previous chimney is completely gone: NO chimney, pillar, cream column, pipe, tower, house, architectural object, candle or standalone strawberry. Fruit belongs on the trees.

Overall hierarchy: rounded fruit trees + broad green meadows first, miniature planetary body second, small creek third. The result should immediately look like a place from the provided cozy game screenshot, not a cake advertising render. Use simple readable large forms for a website header icon and favicon.

Output one square transparent PNG, one complete isolated island-world only, centered with 7% clear padding around its entire silhouette including the tree. Keep all trees and the underside fully in frame. Genuine alpha transparency. Do NOT include the screenshot's ocean, starry background, horizon, floating particles, external shadow, blue crystal, lettering, logo, plate or pedestal.
```

## 完整球形苹果树版提示词

输入顺序：`petit-planet-tree-world.png` 为待调整图标，`cake-planet-style-reference-2026-09-29.png` 为画风参考。由内置 `image_gen` 重设计完整球形与下半球地形，并将果实改为苹果。

```text
Redesign the supplied miniature game-world icon to satisfy three explicit changes: (1) the terrain body must be a COMPLETE NEARLY PERFECT SPHERE, (2) the entire LOWER hemisphere must have the SAME living grassland-and-cream-terrain design as the upper hemisphere, and (3) all fruit on the trees must be unmistakably APPLES.

Reference roles:
IMAGE 1 is the current icon. Preserve its appealing game-world aesthetic: soft bright spring-green scalloped meadows, layered rounded leafy tree canopies, pale warm cream cliffs, a little turquoise stream, gentle painted textures and friendly soft 3D shading. Its old squat island composition and blue moon-like underside must change.
IMAGE 2 is the original in-game screenshot, for art style, soft foliage, palette and texture only. Do NOT carry its dark blue underside into this new design.

Spherical form is critical: design one globe with a terrain-body silhouette approximately as tall as it is wide, smoothly curved all the way around. Show a whole ball, not a half sphere, bowl, flat-topped island, disk, pedestal or truncated globe. The round planetary core is visually dominant. View it in three-quarter view from only slightly above so both upper and lower hemispheres are clearly visible. Trees are modest landmarks attached to the surface, not oversized relative to the globe.

CONTINUOUS ALL-AROUND LANDSCAPE:
Cover the crown, front, sides AND all the way down to the bottom rim with an integrated patchwork of broad rounded fresh green meadow terraces, pale cream banks and small exposed pale-golden cake-like cliff seams. Curve the landforms with the sphere. The lower hemisphere is just as thoughtfully landscaped as the upper: include green grassy slopes, a small scalloped-leaf bush near the lower left, one small white flower patch on the lower front, and curved cream-edged terrain boundaries. No blank base. Remove ALL of the old dark blue rock shell, craters and moon-like circles. Do not use repetitive horizontal layer-cake rings. Keep the subtle cake/cream metaphor as organic terrain geology.
A modest turquoise creek connects an upper meadow, a short soft cascade, and a small lower-side pond across the rounded front-right surface. Water, land, plants and cream strata all belong to the same whole spherical world. Use a few broad clean shapes, not many tiny terraces. Keep water secondary to the green land.

APPLE TREES:
Keep two charming fruit trees, one on the upper-left crown and a smaller one on the upper-right slope, with warm short visible trunks and lush mint-green canopies of overlapping broad rounded leaf lobes. They grow radially from the globe's surface. Replace every coral-orange sphere fruit with a clearly recognizable RED APPLE: classic slightly squat apple body, two rounded upper shoulders separated by a visible top dimple, a short brown stem emerging from that dimple, and one small green leaf. Three apples on the main tree and two on the smaller tree are enough. Their silhouette must read as APPLES, not oranges, peaches, cherries, berries or generic round balls. Use a deeper warm apple red, in the same gentle painted game style.

Maintain the screenshot's soft stylized game rendering, mottled grass texture, diffuse light, rounded edges and gentle warm/cool shading. No hyperrealistic porous cake, glossy resin or plastic collectible style. No chimney, tower, pipe, house, free-standing strawberry or extra props.

One isolated complete spherical world, centered on a square transparent PNG, with 7% transparent safety margins around all extremities including trees. No ocean background, sky, stars, particles, text, outer glow, cast ground shadow, stand or plate. Genuine alpha transparency.
```

## 苹果树版 favicon 简化设计提示词

输入图片：`petit-planet-apple-globe.png`。由内置 `image_gen` 制作独立小尺寸设计，输出 `petit-favicon-32-source.png`，网页只加载由它缩小后的 16／32 px PNG。

```text
Create a dedicated, radically SIMPLIFIED favicon derivative of the supplied Petit apple-world brand illustration. This is a tiny-size icon for 32px and 16px, not a replacement for the full illustration. Preserve the same identity using only a few strong readable shapes.

ONE single centered green spherical little planet fills almost the entire square. The body is genuinely round, with living green terrain across both hemispheres, never a blue shell or a flat island. Keep the supplied art's soft friendly game feeling and spring-green / mint / warm cream / turquoise / apple-red palette, but flatten and simplify the rendering so it remains clear at 16 pixels.

Only these large elements:
1. A large circular spring-green globe with very gentle two-tone shading, a slightly deeper green outer edge and a clean silhouette.
2. ONE broad curved warm-cream terrain seam across its lower half, evoking the cake/cream landscape. No thin stripes or tiny terraces.
3. ONE clean, broad turquoise water shape flowing down the right side into a small rounded blue area. Make the blue conspicuous but secondary. No sparkles, ripples, white specks or highlight dots.
4. ONE squat, very simplified apple tree growing at the upper-left crown. Its canopy is a single compact round mint-green mass with at most three broad lobes, a short sturdy warm-cream trunk, and ONE large unmistakable warm red apple on the front-right of the canopy. The apple has a simple top indentation and a tiny dark stem; optional one broad green leaf. Red apple should be about 16–18% of the whole icon width. The tree is small and partially overlaps the globe, keeping the total outline compact and round, not tall. No second tree.

Remove all grass dots, flowers, bushes, layered leaf scales, fruit clusters, scattered surface texture, craters, extra seams, fine outlines and tiny decorative details. Do not include any letters, border, badge backdrop or extra symbols. Favor crisp broad forms, quiet soft shading and good separation between green, cream, blue and red. Not photorealistic, not an intricate 3D model, not a scene.

Composition: the globe itself occupies about 88–92% of canvas width. Overall object, including the low tree, occupies about 94–96% of canvas height. Center optically, only 2–3% clear transparent padding around outermost points. Nothing cropped. Square PNG with genuine transparent background, no surrounding glow, no shadow cast outside the object, no ground, no sky. Deliver exactly one isolated icon, not a comparison sheet.
```

## 未采用的紧凑版提示词

输入图片：`petit-favicon-32-source.png`。由内置 `image_gen` 进一步压缩轮廓与细节，输出 `petit-favicon-16-source.png`。用户指出树形丢失，未采用此版，不用于网页资源。

```text
Adapt this simplified Petit favicon specifically for SIXTEEN PIXELS. Make a new, much more compact micro-icon, visually related to this supplied icon but with the tree greatly reduced in height.

The whole mark must be ALMOST CIRCULAR and occupy 94% of a square canvas in BOTH width and height. It must NOT have the tall pear-shaped silhouette of the reference. A single round green world fills the square with only 3% transparent margins. A very small squat apple tree is nestled into the upper-left contour of the sphere: its canopy merges visually with the upper green globe and extends only a tiny amount above it. There is no long trunk and no tall free-standing tree. One bold RED APPLE with a simple top notch sits against the tiny canopy at the upper-right of that canopy. The apple is the single red focal spot, about 20% of total icon width. Keep one simple short brown stem, omit the separate leaf if it clutters the tiny shape.

Use only FOUR broad COLOR AREAS plus quiet shading:
- fresh green circular globe across both hemispheres,
- one broad warm cream curved landscape seam across the lower middle,
- one bold turquoise blue curved river-and-pond area on the right, broad enough to remain visible at 16px,
- one warm red apple near the upper left/center.

Keep the same cheerful cozy game palette. Use very simplified, nearly flat two-tone soft shading with CLEAR large color boundaries; no complex gradients, texture, grain, leaf veins, individual leaves, highlights, tiny light lines, flowers, grass specks, bushes, outlines, extra fruit, extra seams or details. Prioritize the immediately readable ROUND green planet with red apple and blue water, not realism or a detailed tree. The lower portion is green terrain, not blue rock.

One single isolated icon, whole circular silhouette visible. Transparent PNG, square, no backdrop, no icon tile, no rectangular badge, no drop shadow, no text. Fill the square at least 90% wide and 90% high with a simple compact round mark. This is an intentional favicon-scale adaptation, not a new website illustration.
```
