# 开发指南

## 技术栈

| 范围         | 选择与配置入口                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| 应用         | Nuxt 4、Vue 3、TypeScript，配置见 `nuxt.config.ts`、`tsconfig.json`。                                          |
| 渲染         | SSG，`pnpm build` 生成 `.output/public` 和 Cloudflare Build Output。                                           |
| 样式         | Tailwind CSS 4、petit-ui，入口为 `app/assets/css/main.css`。                                                   |
| 交互组件     | Reka UI，通过 `reka-ui/nuxt` 按需自动导入。                                                                    |
| 图鉴预览     | Viewer.js，关于页首次预览时动态加载。                                                                          |
| 数据校验     | Zod；JSON 数据接入时定义对应 schema，在读取边界校验。                                                          |
| 代码检查     | Oxlint、Oxfmt、Nuxt 类型检查。                                                                                 |
| 测试         | Vitest、Nuxt Test Utils、Vue Test Utils、happy-dom、Playwright。                                               |
| 静态托管准备 | cf CLI、Cloudflare Workers Static Assets，部署配置见 `cloudflare.config.ts`，构建适配见 `wrangler.config.ts`。 |

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
| `pnpm build`        | 生成静态站点与 `.cloudflare/output/v0/` 部署产物。                    |
| `pnpm preview`      | 通过 cf 的 Wrangler 适配层预览静态产物，默认端口 8787。               |
| `pnpm deploy`       | 重新构建后通过 cf 发布到 Cloudflare，需要部署认证。                   |
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

`recipe-browser.test.ts` 与 `recipe-browser.spec.ts` 覆盖菜名、食材、词条与烹饪方式的混合搜索、部分词条匹配与完整词条边界、候选与未知、空白输入、排序、视图切换、URL 恢复和手机操作。页面在搜索框上方提供单选分类；`recipe-categories.spec.ts` 覆盖分类与关键词交集、两种清空边界、排序与视图保留、刷新和导航恢复、方向键及手机三列两行布局。用例确认旧分区、方式、词条、多选食材及模式参数不再影响结果，切换分类、编辑搜索或排序时会清理。旧 `ingredient` 参数继续转为可见搜索词，清空后没有隐藏条件。

`recipe-primary.test.ts` 覆盖小铭 9/30 的 102 行、明天 94 行与小铭 9/27 历史 99 行独立清点、稳定 ID、主体／补充字段来源、重复槽位与合并格、未知值、品质及独立截图有效量，原件哈希及有效量边界由同一测试覆盖。用户逐项决定还检查原文、槽位、来源引用和重复 ID，并覆盖外婆菜饭去问号、双奶、品质随槽位移动、整行配方未说明及原始转录不变。页面用例验证当前采用配方的厨具、效果与阶级、缺图占位和未知值，且不恢复已移除的来源核对面板。`pnpm data:check` 校验主体、参考及历史资料，包含原图与 12 张独立截图的哈希、尺寸、字节数；雪菜原图及其配套归档、专用校验已删除；关于页与发布图片只保留小铭 9/30 PNG 及明天 9/24 JPEG 两图。

## 静态构建与预览

```sh
pnpm build
pnpm preview
```

`cloudflare.config.ts` 使用 [cf 的 TypeScript 配置](https://developers.cloudflare.com/cf/projects/cloudflare-config/)，维护 Worker 名称、兼容日期与静态路由行为。`worker.assets.htmlHandling` 使用 `drop-trailing-slash`，让 `/about` 直接返回 200；带尾斜杠及 HTML 别名的请求重定向到无尾斜杠地址，与 canonical、站内链接保持一致，首页保留 `/`。`worker.assets.notFoundHandling` 使用 `404-page`，未知路径返回 404。静态资源输入目录由 `wrangler.config.ts` 的 `assetsDirectory` 指定为 `.output/public`。

当前锁定的 cf Beta 会自动识别 Nuxt；直接运行 `cf build` 会调用 `nuxt build`，无法为本项目的 SSG 流程生成 Cloudflare Build Output。项目因此先执行 `nuxt generate --preset static`，再调用 Wrangler 包随附、供 cf 使用的 `cf-wrangler build` 适配入口；`pnpm preview` 同样调用 `cf-wrangler dev`，读取上述新配置并绑定本地回环地址。保留 Wrangler 开发依赖用于这两个适配入口，不再维护旧的 `wrangler.jsonc`。升级 cf 后应重新确认这项限制。

构建命令显式固定 `static` preset，使本地与 Workers Builds 都启用页面抓取。当前 Nitro 会根据 Workers Builds 的 `WORKERS_CI` 环境变量自动选择 `cloudflare-module`，其默认 `crawlLinks: false` 会让未显式列入预渲染清单的首页和关于页被遗漏。构建后的 `.output/public` 与最终 `.cloudflare/output/v0/workers/default/assets` 都应包含 `index.html`、`about/index.html` 及对应 payload；页面 HTTP 状态和无脚本元数据由现有 `tests/e2e/seo.spec.ts` 验证。

静态部署不提供运行时服务端 API；新增动态页面时，需要保证构建阶段能枚举或抓取对应路由。当前业务页面只有首页和关于页；菜谱详情由首页弹窗展示，不生成逐菜 HTML，旧 `/recipes/<id>` 地址返回 404。交互约定见[内容与交互](specs/recipe-browser.md#内容与交互)。

### cf CLI 安装与部署

cf 已作为开发依赖固定版本，运行 `pnpm install --frozen-lockfile` 后可使用 `pnpm exec cf --version`。本项目的 Node.js 24 满足 cf 加载配置所需的 Node.js 22.18 及以上要求。需要在项目外使用时，可选全局安装：

```sh
pnpm add --global cf
cf --version
```

cf 仍处于 Beta，命令和配置可能变化；安装、认证规则见[官方入门文档](https://developers.cloudflare.com/cf/get-started/)。全局命令在项目内会采用项目锁定的版本。cf 使用自己的登录凭据，首次发布时运行：

```sh
pnpm exec cf auth login
pnpm exec cf auth whoami
pnpm deploy
```

`pnpm deploy` 先重新构建，再执行 `cf deploy --prebuilt` 上传该次产物。只检查部署内容而不上传时运行：

```sh
pnpm build
pnpm exec cf deploy --prebuilt --dry-run
```

`--prebuilt` 读取 `.cloudflare/output/v0/`，不会再次触发框架自动构建；干运行无需登录。构建输出及本地生成内容由 `.gitignore` 排除，参见[官方构建与部署说明](https://developers.cloudflare.com/cf/projects/)。

使用 Cloudflare Workers Builds 连接仓库时，生产分支设为 `main`、根目录为仓库根目录，构建命令使用 `pnpm check && pnpm build`，部署命令使用 `pnpm exec cf deploy --prebuilt`。构建环境使用 Node.js 24 与 `package.json` 声明的 pnpm 版本；外部 CI 使用 `pnpm install --frozen-lockfile` 安装，并通过 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 提供部署认证，参见[cf CI 文档](https://developers.cloudflare.com/cf/ci/)。

正式域名的默认地址由 `shared/site.ts` 维护，`cloudflare.config.ts` 的 `worker.domains` 从该地址提取主机名，部署时绑定正式域名。`NUXT_PUBLIC_SITE_URL` 只覆盖构建时的页面地址，不改变部署绑定。首次发布前须确认目标 Cloudflare 账号有对应域名的管理权限；当前本地配置与干运行不代表已经完成线上部署或域名绑定。

### 分享元数据与站点域名

普通 `pnpm build` 使用 `shared/site.ts` 中的默认正式域名，无须另建 `.env`。需要覆盖部署地址时，可从 `.env.example` 复制为本地 `.env` 并修改 `NUXT_PUBLIC_SITE_URL`，或由构建环境注入同名变量。该值须为 HTTP(S) 根域名；支持尾部 `/`，不支持子路径、查询参数、片段或凭据。

这是静态站点，canonical、Open Graph 页面地址和分享图片绝对地址在构建时写入 HTML；域名变化后需要重新构建，单独修改 Cloudflare 的运行环境不会更新已有产物。显式将 `NUXT_PUBLIC_SITE_URL` 设为空字符串时，省略依赖域名的标签。元数据字段、页面差异与 URL 规则见[页面约定](specs/recipe-browser.md#页面元数据与分享预览)。

`server/routes/robots.txt.get.ts` 与 `sitemap.xml.get.ts` 在构建时预渲染为 `.output/public/robots.txt` 和 `sitemap.xml`，不需要额外模块或部署运行时服务。robots 允许抓取全站并声明 sitemap 的绝对地址；sitemap 只收录首页与关于页，使用与 canonical 一致的域名和路径，不包含展示参数或不存在的页面，也不填入缺乏可靠依据的 `lastmod`。两个文件同样随构建域名更新；显式空域名时只生成不含 Sitemap 声明的 robots，省略 sitemap，访问后者返回 404。

`pnpm brand:og-image` 使用已安装的 Playwright Chromium，从 `public/brand-mark.svg` 和 HTML/CSS 排版生成 `public/og-image.png`；`pnpm brand:favicons` 用同一源文件导出 16／32 px PNG favicon。首次导出前运行 `pnpm exec playwright install chromium`。PNG 已纳入仓库，普通构建不要求生成图片或安装浏览器。字体使用系统字体，跨系统重新导出时须检查中文文字与布局，详见[品牌素材记录](references/branding/cake-planet.md#分享图)。

`tests/e2e/seo.spec.ts` 检查首页与关于页在禁用脚本时的分享标签，同时验证客户端导航更新、不带展示参数的 canonical、规范地址的直接 200 与尾斜杠／HTML 别名重定向、分享 PNG 的静态响应和实际尺寸，以及 robots、sitemap 的内容、域名和全部条目的直接访问与 canonical 一致性；已移除的配方地址与未知地址返回 404。弹窗内容、焦点恢复和手机布局沿用菜谱相关浏览器用例验证。Playwright 使用普通构建的默认正式域名；设置 `NUXT_PUBLIC_SITE_URL` 时沿用该值，包括显式空域名。测试从本地静态预览服务读取页面与图片，不请求正式域名。

## Git hooks

`pre-commit` 执行 `pnpm check`，检查整个工作树。检查失败会阻止提交，不会自动修复或暂存文件。

修改 `package.json` 中的 hooks 配置后运行 `pnpm prepare`。`preserveUnused` 保留未由本项目配置的其他 hooks。

同一仓库的多个 Git worktree 默认共用 hooks，检查在触发提交的工作树中执行；该工作树需要具备对应的配置和依赖。
