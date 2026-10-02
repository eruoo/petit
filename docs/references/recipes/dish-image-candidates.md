# 菜品图片候选索引

当前小铭 9/30 的 102 道菜中，101 道有候选配图：98 道使用 Wiki 独立 PNG，茄茄擂辣饭、梦幻星莓漫游派、梦幻番茄汤汁面使用 TapTap 攻略图区域，甜饼果茶显示缺图占位。配方采用规则见[菜谱数据约定](../../recipes.md)。

## 权威清单与读取

| 清单                                                    | 职责                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Wiki 9/26 清单](wiki-dish-icons-2026-09-26.json)       | 95 个来源文件条目的元数据、最初 90 道菜的候选对应、逐项证据与共用图形分组。 |
| [Wiki 10/01 补充清单](wiki-dish-icons-2026-10-01.json)  | 七道秘制菜候选及四道高清替换，六个新增原文件，五个原文件引用前一清单。      |
| [TapTap 清单](taptap-recipe-guides-2026-09-26.json)     | 六张完整攻略 JPEG、七个菜品显示区域、作者、原帖与图片 URL。                 |
| [TapTap 品质资料](../../../data/recipes/qualities.json) | 17 张攻略图的来源身份、逐行菜名及圆底观察；不覆盖当前主体品质。             |

`shared/recipes/images.ts` 从这些清单派生对应关系，优先采用已核对的 Wiki PNG。旧菜通过明天 9/24 记录的 `previousRecipeId` 延续最初配图，新增候选直接引用当前稳定 ID。菜名更正不重新匹配图片；旧清单的名称及候选状态描述原来核对的来源，当前显示名称来自主图转录。

逐菜来源 URL、文件 ID、哈希、尺寸、字节数、候选原因和显示坐标只在 JSON 中维护，本文不复制逐条索引。页面只打包当前使用的文件，完整原件保存在 `docs/references/recipes/`，读取与显示约定见[页面规格](../../specs/recipe-browser.md#菜品配图)。

## 原图保存与去重

Wiki 的 `files[].localPath` 相对于项目根目录，指向未经裁切或重编码的 PNG。2026-10-02 按 SHA-256 分组并逐字节比较后，将 9/26 清单中的 8 个完全相同副本合并：95 条来源记录共用 87 个原文件，共 14,461,591 字节。各条目仍保留独立文件 ID、原始文件名、原图 URL 和校验值；`localArchive` 记录实际文件数量和体积。

以下三组各只保存一个原文件：

- Fruit & Veggie Juice、Homestyle Blend、Rare Blend、Miracle Blend。
- Homestyle Assorted Claypot Stew、Rare Assorted Claypot Stew、Miracle Assorted Claypot Stew。
- Homestyle Assorted Skewers、Rare Assorted Skewers、Miracle Assorted Skewers、Mushroom, Fruit & Veggie Skewers。

Premium Shellfish Rice Bake 与 Seafood Clay Pot Rice 的解码像素相同、文件字节不同，仍分别保留。相同图形不代表菜谱或来源记录可以合并。10/01 新增的六个 PNG 与 TapTap 的六张完整 JPEG 继续独立保存。

TapTap 原图保留作者署名、菜名和品质圆底；页面通过 `displayRegion` 显示菜品区域。历史四个显示区域虽已被 Wiki 高清图替代，其原件仍用于核对当时的对应证据。

## 候选与来源边界

所有对应均为图片候选，`gameVerified: false`。同名中文标签、英文名、外观或友邻线索不能单独证明游戏内身份；配图接入不会回写原始配方、品质或友邻。

- 七道秘制菜仍为英文条目候选。百果甜甜圈的外部水果配方与主图鱼类不同，轰炸大菇肉的外部友邻线索与主图不同，分别保留差异。
- 胡萝卜炖肉、蒜香流心奶黄包、梦幻金玉满堂饭、梦幻草莓奶蛋糕已改用 Wiki 512 × 512 PNG；蒜香流心奶黄包的 TapTap 标签为“蒜香流心奶面包”，保留异名候选。
- 塔法果一杯与青蔬果汁、三种什锦饮共用相似图形，不能仅凭图形确定独立菜名。竹香苹果冰只有英文条目候选，Wiki 力气 70 与用户图鉴 60 的差异保留。
- Wiki 图标为透明底，TapTap 图标带蓝灰、紫或橙金圆底，分辨率也不同。什锦系列的主体图形可以相同、品质底色不同；当前页面底色读取当前品质视图。
- 甜饼果茶的缺图、三道菜暂无独立高清候选，均只表示截至 2026-10-01 已检索来源中的结果，不代表其他来源不存在图片。

最初 Wiki 范围为 [Dish Icons 目录](https://petitplanet.wiki/Category:Dish_Icons)；TapTap 来源为阿Zz的[简单菜篇](https://www.taptap.cn/moment/851862566224266917)、[招牌菜篇](https://www.taptap.cn/moment/852148878751829285)和[宴客菜篇](https://www.taptap.cn/moment/852582459005469363)。图片版权与网页正文许可分别看待，归档和候选对应不表示取得再分发授权；关于页保留来源与版权说明。
