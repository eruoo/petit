# 菜品图片候选索引

本页记录 2026-09-26 的配图核对；当前已更新到小铭 9/30 的 102 道菜，仍有 94 道候选配图，其余八道暂无配图。配方采用规则见[数据约定](../../recipes.md)，下述旧图配方仅说明当时资料冲突。

查找日期：2026-09-26。核对范围为 9 月 23 日图片的 90 条记录（现已原样归档到 `data/recipes/archive/2026-09-23.json`），只寻找可追溯的菜品图片，不据外部攻略更改配方、力气、品质或分类。

当前 9 月 24 日的 94 条均已接入候选配图：90 条经 `previousRecipeId` 延续既有候选，新增四道宴客菜直接引用当前 ID，使用下节所列的 TapTap 同名配图。下文的“现有 90 条”及旧版 ID 均指最初核对范围，具体版本差异见[新版报告](tomorrow-2026-09-24.md)。

两种来源的主体图形、圆形底色和覆盖差异见 [Wiki 与 TapTap 图片对比](wiki-taptap-image-comparison-2026-09-26.md)。

## 新增四道宴客菜的检索结果

2026-09-26 查看阿Zz的[宴客菜原帖](https://www.taptap.cn/moment/852582459005469363)及三张 1080 × 1439 JPEG 原图，四道均有同名标签和紧邻的菜品图标。行号从每张图第一道菜起计，不含标题、页脚；图鉴序号照录外部图片，不替代项目 ID。

| 当前菜谱 ID             | 菜名原文       | 原图位置                           | 外部图鉴序号 | 配图特征                   |
| ----------------------- | -------------- | ---------------------------------- | ------------ | -------------------------- |
| `mt-20260924-guest-004` | 梦幻金玉满堂饭 | [宴客菜第 2 张][guest-2] · 第 5 行 | 100          | 黄色盘上的米饭与配菜       |
| `mt-20260924-guest-012` | 梦幻草莓奶蛋糕 | [宴客菜第 1 张][guest-1] · 第 6 行 | 061          | 粉色多层蛋糕               |
| `mt-20260924-guest-013` | 梦幻星莓漫游派 | [宴客菜第 2 张][guest-2] · 第 1 行 | 062          | 蓝紫色装饰派               |
| `mt-20260924-guest-014` | 梦幻番茄汤汁面 | [宴客菜第 3 张][guest-3] · 第 2 行 | 113          | 红橙色酱汁、番茄装饰的面食 |

四项均为 `same-name-image-candidate`，`gameVerified: false`。这些直链提供完整攻略原图，菜品图标带圆形底色，尚未找到可确认对应的独立透明 PNG。已核对本地 Wiki 清单及此前未匹配的 9 张图标，没有确认新的对应；其中 `Glistening Fruit Pie` 与蓝紫色星莓派外观不同，普通 `Berry Medley Cake` 也不能替代粉色多层的梦幻草莓奶蛋糕。此结论只限本次检索和已有 95 张 Wiki 归档，不代表其他地方不存在独立图标。

配图接入不改写菜谱事实。例如 TapTap 将梦幻番茄汤汁面的第四项写作“肉”、梦幻草莓奶蛋糕的一项写作“火龙果”，当前用户图片中的“？”与“火龙果？”仍按各自来源原样保留。三张完整原图已按下述方式归档，页面用 CSS 显示对应区域；已接入不等于已在游戏中验证。

### 新增原图归档

沿用独立的 `taptap-recipe-guides-2026-09-26/` 目录保存三张原始 JPEG，合计 364,137 字节。与此前三张合并后为六个原文件、725,597 字节，对应七道菜；同一原文件只保存一次。

| 菜名           | 本地原图                                                   | 显示区域 `{ x, y, width, height }` |
| -------------- | ---------------------------------------------------------- | ---------------------------------- |
| 梦幻金玉满堂饭 | [guest-2.jpg](taptap-recipe-guides-2026-09-26/guest-2.jpg) | `{ 90, 932, 150, 150 }`            |
| 梦幻草莓奶蛋糕 | [guest-1.jpg](taptap-recipe-guides-2026-09-26/guest-1.jpg) | `{ 90, 1115, 150, 150 }`           |
| 梦幻星莓漫游派 | [guest-2.jpg](taptap-recipe-guides-2026-09-26/guest-2.jpg) | `{ 90, 197, 150, 150 }`            |
| 梦幻番茄汤汁面 | [guest-3.jpg](taptap-recipe-guides-2026-09-26/guest-3.jpg) | `{ 90, 380, 150, 150 }`            |

[来源清单](taptap-recipe-guides-2026-09-26.json)保留原帖、作者、原图 URL、尺寸、字节数与 SHA-256；`files[].targetRecipes[]` 支持一张攻略图对应多个菜品区域。旧三道菜的 ID、坐标、文件字节保持不变，新增四道使用 9 月 24 日 ID。显示策略及验收结果见[页面规格](../../specs/recipe-browser.md#菜品配图)。

## 可直接获取的独立原文件

2026-09-26 补充检索发现 [The Petit Planet Wiki 的 Dish Icons 目录](https://petitplanet.wiki/Category:Dish_Icons)列出 95 个菜品图标文件。后续[完整覆盖核对](wiki-dish-icons-2026-09-26.md)确认其中 94 个为 512 × 512、1 个为 256 × 256，现有 90 条菜谱中找到 87 条候选、3 条暂缺。文件存在复用，不能用目录数量直接判断是否覆盖全部菜谱。

已在浏览器打开下列文件页及其原文件直链，确认两张均能按 512 × 512 加载，为独立菜品图标。这里的“原文件”指 Wiki 保存的上传文件；尚未验证其是否等同游戏包内未经处理的资源。

| 当前菜名候选 | 外部英文名                  | 文件页与原文件                                                                                                                                                             | 尺寸      |
| ------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 竹香苹果冰   | Bamboo Apple Slushie        | [文件页](https://petitplanet.wiki/File:Bamboo_Apple_Slushie_Icon.png) · [PNG 原文件](https://petitplanet.wiki/images/2/25/Bamboo_Apple_Slushie_Icon.png)                   | 512 × 512 |
| 和煦花果茶   | Blissful Floral & Fruit Tea | [文件页](https://petitplanet.wiki/File:Blissful_Floral_%26_Fruit_Tea_Icon.png) · [PNG 原文件](https://petitplanet.wiki/images/7/7e/Blissful_Floral_%26_Fruit_Tea_Icon.png) | 512 × 512 |

中文对应仍为候选：英文菜名、菜品外观及相应条目的食材描述提供对应线索，但没有据此确认当前中文名称与该站条目的游戏内稳定身份。竹香苹果冰的 [Wiki 条目](https://petitplanet.wiki/Bamboo_Apple_Slushie)只列英文名称，其力气值也与用户附件不同；外部条目不回写到原始转录。

[PetitPlanet.dev 菜谱目录](https://petitplanet.dev/recipes)也提供单张 WebP，例如 [Bamboo Apple Slushie 文件](https://petitplanet.dev/images/dishes/bamboo-apple-slushie.webp)，实际打开为 160 × 160。该站声明资料来自上述 Wiki；需要较大尺寸时优先查看 Wiki 文件页的原图链接，不将这个镜像视为独立交叉验证来源。

两张 Wiki 文件页均将图像版权标为 HoYoverse，页面正文的 CC 许可不能直接当作游戏图像的许可。后续按用户要求，完整核对时取回的 95 张原始 PNG 已[保存到项目资料目录](wiki-dish-icons-2026-09-26.md#本地原图)，来源清单记录各文件本地路径和哈希。页面显示其中 87 条候选配图，另 7 条使用 TapTap 攻略图区域；对应关系仍为候选，未在游戏中验证。显示规则见[页面规格](../../specs/recipe-browser.md#菜品配图)。

## TapTap 攻略图候选结果

找到 TapTap 作者「阿Zz」发布的三篇图鉴，共 17 张攻略图片；已在浏览器中逐张查看，并核对菜名旁的游戏图标。图片内标题标为「连接测试菜肴图鉴」。这只是新图片来源自己的标注，不据此给原始用户附件补写版本或发布时间。

仅就这三篇 TapTap 图鉴核对，现有 90 条记录中，83 条有同名图标候选、6 条有异名候选、1 条未找到对应图片。独立 Wiki 原文件的后续发现见上节，不计入此表。

| 原始图片分区 | 同名候选 | 异名候选 | 未找到 |
| ------------ | -------: | -------: | -----: |
| 简单菜       |       34 |        3 |      0 |
| 招牌菜       |       32 |        1 |      0 |
| 宴客菜       |        8 |        2 |      0 |
| 自由烹饪     |        9 |        0 |      0 |
| 友邻秘方     |        0 |        0 |      1 |

“同名候选”只确认新图内的名字与当前记录原文相同、旁边确有图标，不表示已在游戏中验证。异名候选可能涉及辨读差异、攻略异写或版本变化，当前没有证据认定二者是同一道菜。

## 来源

| 来源代号  | 原帖                                                                     | 作者 | 配图数 |
| --------- | ------------------------------------------------------------------------ | ---- | -----: |
| simple    | [菜肴全收集 · 简单菜肴](https://www.taptap.cn/moment/851862566224266917) | 阿Zz |      8 |
| signature | [连接测试 · 招牌菜篇](https://www.taptap.cn/moment/852148878751829285)   | 阿Zz |      6 |
| guest     | [连接测试 · 宴客菜](https://www.taptap.cn/moment/852582459005469363)     | 阿Zz |      3 |

页码按帖内配图顺序从 1 起；行号按单张图中从上到下的菜品行从 1 起，排除标题和页脚。链接指向帖内实际图片 URL。来源分区与当前菜谱分区各自保留，例如自由烹饪的图片位于新来源的简单菜篇。源图页脚的数字是该作者采用的图鉴序号，不用来替代项目的稳定 ID。

这三篇 TapTap 图鉴提供的是攻略图内嵌的菜品图标，带圆形底色，未裁切成独立素材。页面用 CSS 显示已归档六张原图中的七个目标菜品区域，并提供原帖与带作者署名的完整原图入口。这些帖子中未见独立图标素材包或明确的素材再分发说明。

## 三道菜的 TapTap 原图归档

2026-09-26 按用户要求取得下列三张完整攻略原图，单独保存到 [taptap-recipe-guides-2026-09-26/](taptap-recipe-guides-2026-09-26/)，与 `wiki-dish-icons-2026-09-26/` 分开放置。均为 1080 × 1439 JPEG，合计 361,460 字节；完整保留图中的菜名、圆形底色和作者署名，没有裁切或重绘。

| 菜名           | 本地原图                                                           | 位置                   |
| -------------- | ------------------------------------------------------------------ | ---------------------- |
| 胡萝卜炖肉     | [simple-2.jpg](taptap-recipe-guides-2026-09-26/simple-2.jpg)       | 简单菜第 2 张，第 3 行 |
| 茄茄擂辣饭     | [signature-1.jpg](taptap-recipe-guides-2026-09-26/signature-1.jpg) | 招牌菜第 1 张，第 4 行 |
| 蒜香流心奶面包 | [signature-3.jpg](taptap-recipe-guides-2026-09-26/signature-3.jpg) | 招牌菜第 3 张，第 5 行 |

[来源清单](taptap-recipe-guides-2026-09-26.json)记录原帖、图片 URL、作者、菜谱稳定 ID、图中行号、本地路径、尺寸、字节数和 SHA-256，以及页面显示区域的原图像素坐标 `targetRecipes[].displayRegion`。保存日期不解释为原帖发布时间或游戏版本。这三张是包含目标菜品的攻略原图，尚不是独立菜品图标；它们不改变仅针对 Wiki 目录的“3 条暂缺”结论。

## 异名候选与缺失项

| 当前记录原文   | 新图文字       | 图片位置                             | 状态             |
| -------------- | -------------- | ------------------------------------ | ---------------- |
| 暖暖阳汤面     | 暖暖阳春面     | [simple-8][simple-8] · 第 3 行       | 暂不建立确定对应 |
| 四时蔬果汤     | 四时果蔬汤     | [simple-4][simple-4] · 第 6 行       | 暂不建立确定对应 |
| 波香烤鱼串     | 菠香烤鱼串     | [simple-2][simple-2] · 第 5 行       | 暂不建立确定对应 |
| 田园蔬烩披萨   | 田园蔬荟披萨   | [signature-6][signature-6] · 第 2 行 | 暂不建立确定对应 |
| 年糕蔬菇面     | 年糕菇蔬面     | [guest-3][guest-3] · 第 1 行         | 暂不建立确定对应 |
| 梦幻仙风龙虾锅 | 梦幻鲜风龙虾锅 | [guest-1][guest-1] · 第 2 行         | 暂不建立确定对应 |
| 竹香苹果冰     | —              | —                                    | 本轮未找到       |

「竹香苹果冰」的中文定向搜索找到了[米游社旧攻略](https://www.miyoushe.com/planet/article/70912775)，但该帖正文明确说明此菜未知／缺少，不能据此给它配图。下表与逐条索引中的“未找到”仅限 TapTap 图鉴；补充检索已经发现上节所列英文 Wiki 图标候选。

当前「珍蟹腌笃鲜」自身仍保留原始附件辨读的待确认状态；新图的同名标签不自动消除这一状态。不同来源出现的食材、烹饪方式或名称差异都不回写到原始转录。

## 逐条对应

| 菜谱 ID                     | 当前菜名原文   | 匹配状态   | 新图文字（不同时列出） | 图及行号                             |
| --------------------------- | -------------- | ---------- | ---------------------- | ------------------------------------ |
| `mt-20260923-simple-001`    | 和煦花果茶     | 同名候选   | —                      | [simple-5][simple-5] · 第 3 行       |
| `mt-20260923-simple-002`    | 馥郁瓜果茶     | 同名候选   | —                      | [simple-5][simple-5] · 第 4 行       |
| `mt-20260923-simple-003`    | 菌菇汤         | 同名候选   | —                      | [simple-4][simple-4] · 第 4 行       |
| `mt-20260923-simple-004`    | 时鱼汤         | 同名候选   | —                      | [simple-3][simple-3] · 第 6 行       |
| `mt-20260923-simple-005`    | 靓仔鱼虾汤     | 同名候选   | —                      | [simple-4][simple-4] · 第 2 行       |
| `mt-20260923-simple-006`    | 海胆龙虾汤     | 同名候选   | —                      | [simple-4][simple-4] · 第 5 行       |
| `mt-20260923-simple-007`    | 菌菇鲜鱼羹     | 同名候选   | —                      | [simple-4][simple-4] · 第 3 行       |
| `mt-20260923-simple-008`    | 暖暖阳汤面     | 异名待核对 | 暖暖阳春面             | [simple-8][simple-8] · 第 3 行       |
| `mt-20260923-simple-009`    | 乡蔬小麦面     | 同名候选   | —                      | [simple-8][simple-8] · 第 4 行       |
| `mt-20260923-simple-010`    | 乡野粥         | 同名候选   | —                      | [simple-7][simple-7] · 第 2 行       |
| `mt-20260923-simple-011`    | 谷物粥         | 同名候选   | —                      | [simple-7][simple-7] · 第 1 行       |
| `mt-20260923-simple-012`    | 炒鲜蔬         | 同名候选   | —                      | [simple-1][simple-1] · 第 1 行       |
| `mt-20260923-simple-013`    | 番茄龙虾汤     | 同名候选   | —                      | [simple-4][simple-4] · 第 1 行       |
| `mt-20260923-simple-014`    | 汤汁番茄鱼     | 同名候选   | —                      | [simple-1][simple-1] · 第 3 行       |
| `mt-20260923-simple-015`    | 炒蟹贝         | 同名候选   | —                      | [simple-1][simple-1] · 第 2 行       |
| `mt-20260923-simple-016`    | 蒸海鲜         | 同名候选   | —                      | [simple-1][simple-1] · 第 4 行       |
| `mt-20260923-simple-017`    | 拾贝粥         | 同名候选   | —                      | [simple-7][simple-7] · 第 3 行       |
| `mt-20260923-simple-018`    | 海鲜粥         | 同名候选   | —                      | [simple-7][simple-7] · 第 4 行       |
| `mt-20260923-simple-019`    | 胡萝卜炖肉     | 同名候选   | —                      | [simple-2][simple-2] · 第 3 行       |
| `mt-20260923-simple-020`    | 四时蔬果汤     | 异名待核对 | 四时果蔬汤             | [simple-4][simple-4] · 第 6 行       |
| `mt-20260923-simple-021`    | 沁凉水果面     | 同名候选   | —                      | [simple-8][simple-8] · 第 2 行       |
| `mt-20260923-simple-022`    | 果香鱼壶       | 同名候选   | —                      | [simple-1][simple-1] · 第 5 行       |
| `mt-20260923-simple-023`    | 海鲜大铺面     | 同名候选   | —                      | [simple-8][simple-8] · 第 1 行       |
| `mt-20260923-simple-024`    | 绚烂果汁       | 同名候选   | —                      | [simple-5][simple-5] · 第 5 行       |
| `mt-20260923-simple-025`    | 恬恬莓米酿     | 同名候选   | —                      | [simple-5][simple-5] · 第 6 行       |
| `mt-20260923-simple-026`    | 青蔬果汁       | 同名候选   | —                      | [simple-6][simple-6] · 第 1 行       |
| `mt-20260923-simple-027`    | 甘蔬米酪       | 同名候选   | —                      | [simple-6][simple-6] · 第 3 行       |
| `mt-20260923-simple-028`    | 绵绵麦奶       | 同名候选   | —                      | [simple-6][simple-6] · 第 2 行       |
| `mt-20260923-simple-029`    | 炽汁多果烤串   | 同名候选   | —                      | [simple-3][simple-3] · 第 1 行       |
| `mt-20260923-simple-030`    | 烤米布丁       | 同名候选   | —                      | [simple-5][simple-5] · 第 2 行       |
| `mt-20260923-simple-031`    | 麦烘蛋糕       | 同名候选   | —                      | [simple-5][simple-5] · 第 1 行       |
| `mt-20260923-simple-032`    | 蘑菇果蔬烤串   | 同名候选   | —                      | [simple-3][simple-3] · 第 2 行       |
| `mt-20260923-simple-033`    | 鱼香焗饭       | 同名候选   | —                      | [simple-7][simple-7] · 第 5 行       |
| `mt-20260923-simple-034`    | 果酥烤鱼       | 同名候选   | —                      | [simple-2][simple-2] · 第 4 行       |
| `mt-20260923-simple-035`    | 波香烤鱼串     | 异名待核对 | 菠香烤鱼串             | [simple-2][simple-2] · 第 5 行       |
| `mt-20260923-simple-036`    | 蔬风烤鱼       | 同名候选   | —                      | [simple-2][simple-2] · 第 6 行       |
| `mt-20260923-simple-037`    | 海烩焗饭       | 同名候选   | —                      | [simple-7][simple-7] · 第 6 行       |
| `mt-20260923-signature-001` | 果蔬沙拉       | 同名候选   | —                      | [signature-5][signature-5] · 第 3 行 |
| `mt-20260923-signature-002` | 番笋红宋汤     | 同名候选   | —                      | [signature-1][signature-1] · 第 6 行 |
| `mt-20260923-signature-003` | 茄茄擂辣饭     | 同名候选   | —                      | [signature-1][signature-1] · 第 4 行 |
| `mt-20260923-signature-004` | 刺锅海胆蒸蛋   | 同名候选   | —                      | [signature-1][signature-1] · 第 1 行 |
| `mt-20260923-signature-005` | 裹裹虾炸鱼     | 同名候选   | —                      | [signature-5][signature-5] · 第 1 行 |
| `mt-20260923-signature-006` | 鲜笋鱼汤       | 同名候选   | —                      | [signature-2][signature-2] · 第 6 行 |
| `mt-20260923-signature-007` | 珍蟹腌笃鲜     | 同名候选   | —                      | [signature-3][signature-3] · 第 1 行 |
| `mt-20260923-signature-008` | 辣龙虾过海     | 同名候选   | —                      | [signature-2][signature-2] · 第 1 行 |
| `mt-20260923-signature-009` | 握鱼大手卷     | 同名候选   | —                      | [signature-5][signature-5] · 第 4 行 |
| `mt-20260923-signature-010` | 鱼蔬大拉面     | 同名候选   | —                      | [signature-6][signature-6] · 第 3 行 |
| `mt-20260923-signature-011` | 晶彩蒸鱼饭     | 同名候选   | —                      | [signature-5][signature-5] · 第 5 行 |
| `mt-20260923-signature-012` | 梦幻锦绣香蔬宴 | 同名候选   | —                      | [signature-1][signature-1] · 第 3 行 |
| `mt-20260923-signature-013` | 梦幻三仙过海鱼 | 同名候选   | —                      | [signature-5][signature-5] · 第 2 行 |
| `mt-20260923-signature-014` | 梦幻双色升鱼宴 | 同名候选   | —                      | [signature-1][signature-1] · 第 5 行 |
| `mt-20260923-signature-015` | 塔法果一杯     | 同名候选   | —                      | [signature-4][signature-4] · 第 6 行 |
| `mt-20260923-signature-016` | 甜瓜花茶       | 同名候选   | —                      | [signature-3][signature-3] · 第 6 行 |
| `mt-20260923-signature-017` | 禾夏米麦奶     | 同名候选   | —                      | [signature-4][signature-4] · 第 2 行 |
| `mt-20260923-signature-018` | 多彩萃蔬汁     | 同名候选   | —                      | [signature-4][signature-4] · 第 5 行 |
| `mt-20260923-signature-019` | 禾夏果米酿     | 同名候选   | —                      | [signature-4][signature-4] · 第 4 行 |
| `mt-20260923-signature-020` | 漫香果麦奶     | 同名候选   | —                      | [signature-4][signature-4] · 第 1 行 |
| `mt-20260923-signature-021` | 珍蔬麦饮       | 同名候选   | —                      | [signature-4][signature-4] · 第 3 行 |
| `mt-20260923-signature-022` | 香米糕         | 同名候选   | —                      | [signature-3][signature-3] · 第 4 行 |
| `mt-20260923-signature-023` | 草莓奶蛋糕     | 同名候选   | —                      | [signature-3][signature-3] · 第 3 行 |
| `mt-20260923-signature-024` | 蒜香流心奶面包 | 同名候选   | —                      | [signature-3][signature-3] · 第 5 行 |
| `mt-20260923-signature-025` | 田园蔬烩披萨   | 异名待核对 | 田园蔬荟披萨           | [signature-6][signature-6] · 第 2 行 |
| `mt-20260923-signature-026` | 番茄炸鱼披萨   | 同名候选   | —                      | [signature-5][signature-5] · 第 6 行 |
| `mt-20260923-signature-027` | 花香蜜瓜派     | 同名候选   | —                      | [signature-3][signature-3] · 第 2 行 |
| `mt-20260923-signature-028` | 满满大烩菜     | 同名候选   | —                      | [signature-1][signature-1] · 第 2 行 |
| `mt-20260923-signature-029` | 海岸风情烤串   | 同名候选   | —                      | [signature-2][signature-2] · 第 4 行 |
| `mt-20260923-signature-030` | 炙鱼烤虾贝     | 同名候选   | —                      | [signature-2][signature-2] · 第 2 行 |
| `mt-20260923-signature-031` | 美味海风披萨   | 同名候选   | —                      | [signature-6][signature-6] · 第 1 行 |
| `mt-20260923-signature-032` | 水果烤虾拼盘   | 同名候选   | —                      | [signature-2][signature-2] · 第 3 行 |
| `mt-20260923-signature-033` | 梦幻奇迹蒜龙虾 | 同名候选   | —                      | [signature-2][signature-2] · 第 5 行 |
| `mt-20260923-guest-001`     | 年糕蔬菇面     | 异名待核对 | 年糕菇蔬面             | [guest-3][guest-3] · 第 1 行         |
| `mt-20260923-guest-002`     | 多果流彩捞饭   | 同名候选   | —                      | [guest-2][guest-2] · 第 2 行         |
| `mt-20260923-guest-003`     | 梦幻仙风龙虾锅 | 异名待核对 | 梦幻鲜风龙虾锅         | [guest-1][guest-1] · 第 2 行         |
| `mt-20260923-guest-004`     | 外婆菜饭       | 同名候选   | —                      | [guest-2][guest-2] · 第 3 行         |
| `mt-20260923-guest-005`     | 梦幻海贝海鲜烩 | 同名候选   | —                      | [guest-1][guest-1] · 第 3 行         |
| `mt-20260923-guest-006`     | 梦幻海岸虾鱼筵 | 同名候选   | —                      | [guest-1][guest-1] · 第 1 行         |
| `mt-20260923-guest-007`     | 梦幻鱼鲜寿司   | 同名候选   | —                      | [guest-2][guest-2] · 第 4 行         |
| `mt-20260923-guest-008`     | 三色果米糕     | 同名候选   | —                      | [guest-1][guest-1] · 第 5 行         |
| `mt-20260923-guest-009`     | 时蔬烧烤派对   | 同名候选   | —                      | [guest-1][guest-1] · 第 4 行         |
| `mt-20260923-guest-010`     | 三色蔬焗饭     | 同名候选   | —                      | [guest-2][guest-2] · 第 6 行         |
| `mt-20260923-free-001`      | 家常什锦砂锅   | 同名候选   | —                      | [simple-2][simple-2] · 第 1 行       |
| `mt-20260923-free-002`      | 珍稀什锦砂锅   | 同名候选   | —                      | [simple-1][simple-1] · 第 6 行       |
| `mt-20260923-free-003`      | 梦幻什锦砂锅   | 同名候选   | —                      | [simple-2][simple-2] · 第 2 行       |
| `mt-20260923-free-004`      | 家常什锦饮     | 同名候选   | —                      | [simple-6][simple-6] · 第 4 行       |
| `mt-20260923-free-005`      | 珍稀什锦饮     | 同名候选   | —                      | [simple-6][simple-6] · 第 5 行       |
| `mt-20260923-free-006`      | 梦幻什锦饮     | 同名候选   | —                      | [simple-6][simple-6] · 第 6 行       |
| `mt-20260923-free-007`      | 家常什锦烧烤   | 同名候选   | —                      | [simple-3][simple-3] · 第 3 行       |
| `mt-20260923-free-008`      | 珍稀什锦烧烤   | 同名候选   | —                      | [simple-3][simple-3] · 第 4 行       |
| `mt-20260923-free-009`      | 梦幻什锦烧烤   | 同名候选   | —                      | [simple-3][simple-3] · 第 5 行       |
| `mt-20260923-neighbor-001`  | 竹香苹果冰     | 未找到     | —                      | —                                    |

## 校验范围

- 17 张源图经浏览器视觉核对；较易混淆的「菠香烤鱼串」与「田园蔬荟披萨」另行放大确认。
- 逐条索引包含 90 个唯一的现有菜谱 ID；所有候选图及行号均指向上述已查看的图片，没有为「竹香苹果冰」使用相似图代替。
- 本轮仅新增候选索引与文档导航，没有修改菜谱 JSON、schema 或页面；不重复运行与文档无关的构建测试。

[simple-1]: https://img2-tc.tapimg.com/moment/etag/Fs7A5l29coRYKj4okDiP94YUJdh-_20260923163604.jpg/_tap_ugc.jpg
[simple-2]: https://img2-tc.tapimg.com/moment/etag/FhnyhID0H5FTqrcX9vilV1zHJqgm_20260923163604.jpg/_tap_ugc.jpg
[simple-3]: https://img2-tc.tapimg.com/moment/etag/FthUg06JZnmKT4IjgqRTMC2Qb9e-_20260923163604.jpg/_tap_ugc.jpg
[simple-4]: https://img2-tc.tapimg.com/moment/etag/Fvz6kuXOGQtfFYjKQDDZR_Re_UUy_20260923163604.jpg/_tap_ugc.jpg
[simple-5]: https://img2-tc.tapimg.com/moment/etag/Fh3DhqUtW7h9q1-pOEDN77iRCY9f_20260923163604.jpg/_tap_ugc.jpg
[simple-6]: https://img2-tc.tapimg.com/moment/etag/Fo4k57IyBb7wqrn32AqAkHbMG1eL_20260923163604.jpg/_tap_ugc.jpg
[simple-7]: https://img2-tc.tapimg.com/moment/etag/Fs8TowJboMhP38-ZQlB935PjG0qL_20260923163604.jpg/_tap_ugc.jpg
[simple-8]: https://img2-tc.tapimg.com/moment/etag/FsnlbRDglFovPjJr290wMYJjLbjp_20260923163604.jpg/_tap_ugc.jpg
[signature-1]: https://img2-tc.tapimg.com/moment/etag/FgaP2gm12_Wr6Y0eIpOrQ4X61OVE_20260924113429.jpg/_tap_ugc.jpg
[signature-2]: https://img2-tc.tapimg.com/moment/etag/Fqo8s6CxLrjmVUE8sbobPS1jGAz3_20260924113429.jpg/_tap_ugc.jpg
[signature-3]: https://img2-tc.tapimg.com/moment/etag/FsZYOwYgZaGn1z_GUd6Q6xFirI8v_20260924113429.jpg/_tap_ugc.jpg
[signature-4]: https://img2-tc.tapimg.com/moment/etag/FqqFF9li9lLBZZX2RvnhM1w4yr3W_20260924113429.jpg/_tap_ugc.jpg
[signature-5]: https://img2-tc.tapimg.com/moment/etag/FmWxu_WAT6Wv8O6-Fe-LTsShjESS_20260924152509.jpg/_tap_ugc.jpg
[signature-6]: https://img2-tc.tapimg.com/moment/etag/Fqcc_-gDkmNW_P8bWtkWXcuf5P9C_20260924113429.jpg/_tap_ugc.jpg
[guest-1]: https://img2-tc.tapimg.com/moment/etag/FgPBZYSRsFoMtbeFUwLeh9LS-7fq_20260925161637.jpg/_tap_ugc.jpg
[guest-2]: https://img2-tc.tapimg.com/moment/etag/FjYH8U-FerTjByEipRjQWxNz2r8B_20260925161637.jpg/_tap_ugc.jpg
[guest-3]: https://img2-tc.tapimg.com/moment/etag/FiURXwk0DpWVZkvrDNlMq3G0X7vY_20260925161637.jpg/_tap_ugc.jpg
