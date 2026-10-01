# 开发指南

## 技术栈

| 范围         | 选择与配置入口                                                        |
| ------------ | --------------------------------------------------------------------- |
| 应用         | Nuxt 4、Vue 3、TypeScript，配置见 `nuxt.config.ts`、`tsconfig.json`。 |
| 渲染         | SSG，`pnpm build` 生成 `.output/public`。                             |
| 样式         | Tailwind CSS 4、petit-ui，入口为 `app/assets/css/main.css`。          |
| 交互组件     | Reka UI，通过 `reka-ui/nuxt` 按需自动导入。                           |
| 图鉴预览     | Viewer.js，关于页首次预览时动态加载。                                 |
| 数据校验     | Zod；JSON 数据接入时定义对应 schema，在读取边界校验。                 |
| 代码检查     | Oxlint、Oxfmt、Nuxt 类型检查。                                        |
| 测试         | Vitest、Nuxt Test Utils、Vue Test Utils、happy-dom、Playwright。      |
| 静态托管准备 | Wrangler、Cloudflare Workers Static Assets，配置见 `wrangler.jsonc`。 |

依赖的准确版本由 `package.json` 和锁文件维护。首页为[本地菜谱速查页面](specs/recipe-browser.md)，使用 Vue 响应式状态与 URL 参数搜索；本地菜谱 JSON、Zod schema、读取边界与来源资料见[菜谱数据约定](recipes.md)。暂不引入 Pinia、数据库或 CMS。

Tailwind 按[官方 Nuxt 指南](https://tailwindcss.com/docs/installation/framework-guides/nuxt)使用 Vite 插件。petit-ui 提供设计 token，样式入口先导入 Tailwind，再导入 `petit-ui/tailwind.css`；Reka UI 提供需要自行添加样式的交互组件。

## 环境与安装

使用 Node.js 24，pnpm 版本以根目录 `package.json` 的 `packageManager` 为准。

```sh
pnpm install
```

安装时通过项目的 `prepare` 脚本生成 Nuxt 类型并注册 simple-git-hooks。依赖版本由 `pnpm-lock.yaml` 锁定；CI 安装使用 `pnpm install --frozen-lockfile`。`pnpm-workspace.yaml` 只允许必要依赖执行安装脚本。

```sh
pnpm dev
```

Nuxt 开发服务默认运行在 `http://localhost:3000`。应用入口是 `app/app.vue`，页面放在 `app/pages/`，全局样式放在 `app/assets/css/`。Vue 组件有脚本逻辑时使用 `<script setup lang="ts">`。

应用运行时通过 Nuxt 的 `#shared/` 别名导入共享模块。当前构建器会将 `shared/` 模块外置给 Nitro 处理；跨目录的相对导入可能在 SSR 产物中生成错误路径。直接由 Node.js 执行的校验脚本与单元测试入口继续使用相对路径；Vitest 单元测试配置和 `nodeTsConfig` 同步配置 `#shared/` 映射，供测试引用的应用工具函数使用。

## 日常检查

| 命令                | 用途                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm check`        | 依次执行代码、格式、类型、菜谱数据检查和 Vitest。                     |
| `pnpm data:check`   | 校验菜谱、独立清点覆盖率与原图文件；追加 `--details` 查看待核对字段。 |
| `pnpm lint`         | 使用 Oxlint 检查代码，警告也会使检查失败。                            |
| `pnpm lint:fix`     | 应用 Oxlint 的自动修复。                                              |
| `pnpm format`       | 使用 Oxfmt 格式化文件。                                               |
| `pnpm format:check` | 检查格式，不修改文件。                                                |
| `pnpm typecheck`    | 检查 Vue、TypeScript 和 Nuxt 类型。                                   |
| `pnpm test`         | 运行 Vitest。                                                         |
| `pnpm test:watch`   | 以监听模式运行 Vitest。                                               |
| `pnpm test:e2e`     | 构建静态站点后运行 Chromium 端到端测试。                              |
| `pnpm build`        | 生成静态站点到 `.output/public`。                                     |
| `pnpm preview`      | 使用 Wrangler 在本地预览静态产物，默认端口 8787。                     |
| `pnpm prepare`      | 生成 Nuxt 类型并安装或更新 Git hooks。                                |

Oxlint 配置见 `oxlint.config.ts`，启用 TypeScript、Vue 等内置规则插件。Oxfmt 配置见 `.oxfmtrc.json`，采用默认格式规则，并排除由 pnpm 管理的锁文件。生成目录通过 `.gitignore` 排除。

Oxlint 对 Vue 文件的检查范围为脚本部分，`pnpm typecheck` 补充 Vue 模板与 TypeScript 类型检查。`nuxt.config.ts` 中的 `typescript.nodeTsConfig` 将根目录工具配置、`scripts`、`tests/unit` 与 `tests/e2e` 纳入同一检查；Nuxt 默认检查 `shared`。Nuxt 开发、构建与测试转译不代替类型检查。菜谱脚本直接使用 Node.js 24 的 TypeScript 支持，无额外运行器依赖。

TypeScript 暂固定在 6.x，以兼容当前 vue-tsc 所需的编译器 API；升级大版本前须验证 `pnpm typecheck`。

## 测试

测试配置见 `vitest.config.ts` 和 `playwright.config.ts`，按[Nuxt 测试指南](https://nuxt.com/docs/4.x/getting-started/testing)区分运行环境：

- `tests/unit/**/*.test.ts`：纯函数、数据 schema 等，不依赖 Nuxt，使用 Node 环境。
- `tests/nuxt/**/*.test.ts`：需要 Nuxt 自动导入、路由或组件挂载的测试，使用 Nuxt 与 happy-dom 环境。
- `tests/e2e/**/*.spec.ts`：Playwright 测试，针对构建后的静态站点运行。

`tests/unit/recipes.test.ts` 覆盖菜谱数据、附件完整性、来源引用和关键转录行为；`tests/unit/recipe-browser.test.ts` 覆盖搜索、排序和展示语义；`tests/unit/recipe-images.test.ts` 检查配图覆盖、归档文件哈希、来源与显示区域。`tests/e2e/recipe-browser.spec.ts` 验证静态页面的搜索、URL 恢复、详情和手机操作；`recipe-images.spec.ts` 验证本地图片加载、攻略图区域和加载失败占位；`about.spec.ts` 验证关于页导航、直接刷新、分项来源与两位作者的图鉴。`recipe-qualities.test.ts` 校验独立品质状态、颜色与原底色、来源引用及未知值；`recipe-qualities.spec.ts` 验证品质底色、文字和未知状态。`ingredient-qualities.test.ts` 校验食材品质与底色、用户解释引用及独立清点数量；`ingredient-qualities.spec.ts` 验证食材品质文字、重复槽位、待确认食材与手机布局。当前没有单独的 Nuxt 组件测试。首次运行端到端测试前安装浏览器：

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright 默认使用 `127.0.0.1:4173` 启动独立预览服务，不复用已有服务。端口被占用时可运行 `PLAYWRIGHT_PORT=4175 pnpm test:e2e`。失败时在 `test-results/` 保留截图与 trace。端到端测试需要构建和浏览器，单独运行，不纳入提交 hook。

`about.spec.ts` 同时验证图鉴预览的原尺寸、缩放、拖动、切图、打开原图、键盘与焦点返回，覆盖普通及减少动态效果设置下刚打开即关闭、再次打开后用 Esc 关闭；使用 Chromium 触摸模拟检查手机双指缩放与按钮布局，并验证禁用脚本时的原图回退。触摸模拟不等同于真实手机性能测试。

`recipe-browser.test.ts` 与 `recipe-browser.spec.ts` 覆盖菜名、食材、词条与烹饪方式的混合搜索、部分词条匹配与完整词条边界、候选与未知、空白输入、排序、视图切换、URL 恢复和手机操作。页面只保留搜索；用例确认旧分区、方式、词条、多选食材及模式参数不再影响结果，编辑搜索或排序时会清理。旧 `ingredient` 参数继续转为可见搜索词，清空后没有隐藏条件。

`recipe-primary.test.ts` 覆盖小铭 9/30 的 102 行、明天 94 行与小铭 9/27 历史 99 行独立清点、稳定 ID、主体／补充字段来源、重复槽位与合并格、未知值、品质及独立截图有效量，原件哈希及有效量边界由同一测试覆盖。用户逐项决定还检查原文、槽位、来源引用和重复 ID，并覆盖外婆菜饭去问号、双奶、品质随槽位移动、整行配方未说明及原始转录不变。页面用例验证当前采用配方的厨具、效果与阶级、缺图占位和未知值，且不恢复已移除的来源核对面板。`pnpm data:check` 校验主体、参考及历史资料，包含原图与 12 张独立截图的哈希、尺寸、字节数；雪菜原图及其配套归档、专用校验已删除；关于页与发布图片只保留小铭 9/30 PNG 及明天 9/24 JPEG 两图。

## 静态构建与预览

```sh
pnpm build
pnpm preview
```

`wrangler.jsonc` 只提供静态资源目录，按[Workers SSG 配置](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)将未知路径返回为 404。静态部署不提供运行时服务端 API；新增动态页面时，需要保证构建阶段能枚举或抓取对应路由。

当前配置用于本地验证和后续托管准备，尚未发布。用户已确认计划使用的正式域名，默认地址由 `shared/site.ts` 维护；该配置不代表已完成域名绑定或部署，首次发布前仍需确认 Cloudflare 账号、部署目标和域名绑定。

### 分享元数据与站点域名

普通 `pnpm build` 使用 `shared/site.ts` 中的默认正式域名，无须另建 `.env`。需要覆盖部署地址时，可从 `.env.example` 复制为本地 `.env` 并修改 `NUXT_PUBLIC_SITE_URL`，或由构建环境注入同名变量。该值须为 HTTP(S) 根域名；支持尾部 `/`，不支持子路径、查询参数、片段或凭据。

这是静态站点，canonical、Open Graph 页面地址和分享图片绝对地址在构建时写入 HTML；域名变化后需要重新构建，单独修改 Wrangler 的运行环境不会更新已有产物。显式将 `NUXT_PUBLIC_SITE_URL` 设为空字符串时，省略依赖域名的标签。元数据字段、页面差异与 URL 规则见[页面约定](specs/recipe-browser.md#页面元数据与分享预览)。

`pnpm brand:og-image` 使用已安装的 Playwright Chromium，从现有品牌原图和 HTML/CSS 排版生成 `public/og-image.png`；首次导出前运行 `pnpm exec playwright install chromium`。PNG 已纳入仓库，普通构建不要求生成图片或安装浏览器。字体使用系统字体，跨系统重新导出时须检查中文文字与布局，详见[品牌素材记录](references/branding/cake-planet.md#分享图)。

`tests/e2e/seo.spec.ts` 检查首页和关于页在禁用脚本时的分享标签、客户端导航更新、不带展示参数的 canonical，以及分享 PNG 的静态响应和实际尺寸。Playwright 使用普通构建的默认正式域名；设置 `NUXT_PUBLIC_SITE_URL` 时沿用该值。测试从本地静态预览服务读取页面与图片，不请求正式域名。

## Git hooks

`pre-commit` 执行 `pnpm check`，检查整个工作树。检查失败会阻止提交，不会自动修复或暂存文件。

修改 `package.json` 中的 hooks 配置后运行 `pnpm prepare`。`preserveUnused` 保留未由本项目配置的其他 hooks。

同一仓库的多个 Git worktree 默认共用 hooks，检查在触发提交的工作树中执行；该工作树需要具备对应的配置和依赖。
