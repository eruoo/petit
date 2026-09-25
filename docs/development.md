# 开发指南

## 技术栈

| 范围         | 选择与配置入口                                                        |
| ------------ | --------------------------------------------------------------------- |
| 应用         | Nuxt 4、Vue 3、TypeScript，配置见 `nuxt.config.ts`、`tsconfig.json`。 |
| 渲染         | SSG，`pnpm build` 生成 `.output/public`。                             |
| 样式         | Tailwind CSS 4、petit-ui，入口为 `app/assets/css/main.css`。          |
| 交互组件     | Reka UI，通过 `reka-ui/nuxt` 按需自动导入。                           |
| 数据校验     | Zod；JSON 数据接入时定义对应 schema，在读取边界校验。                 |
| 代码检查     | Oxlint、Oxfmt、Nuxt 类型检查。                                        |
| 测试         | Vitest、Nuxt Test Utils、Vue Test Utils、happy-dom、Playwright。      |
| 静态托管准备 | Wrangler、Cloudflare Workers Static Assets，配置见 `wrangler.jsonc`。 |

依赖的准确版本由 `package.json` 和锁文件维护。当前页面仅保留 Petit 入口；菜谱数据和 schema 随实际数据接入，不预设业务结构。后续客户端筛选使用 Vue 响应式状态与 URL 参数，暂不引入 Pinia、数据库或 CMS。

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

## 日常检查

| 命令                | 用途                                              |
| ------------------- | ------------------------------------------------- |
| `pnpm check`        | 依次执行代码检查、格式检查、类型检查和 Vitest。   |
| `pnpm lint`         | 使用 Oxlint 检查代码，警告也会使检查失败。        |
| `pnpm lint:fix`     | 应用 Oxlint 的自动修复。                          |
| `pnpm format`       | 使用 Oxfmt 格式化文件。                           |
| `pnpm format:check` | 检查格式，不修改文件。                            |
| `pnpm typecheck`    | 检查 Vue、TypeScript 和 Nuxt 类型。               |
| `pnpm test`         | 运行 Vitest。                                     |
| `pnpm test:watch`   | 以监听模式运行 Vitest。                           |
| `pnpm test:e2e`     | 构建静态站点后运行 Chromium 端到端测试。          |
| `pnpm build`        | 生成静态站点到 `.output/public`。                 |
| `pnpm preview`      | 使用 Wrangler 在本地预览静态产物，默认端口 8787。 |
| `pnpm prepare`      | 生成 Nuxt 类型并安装或更新 Git hooks。            |

Oxlint 配置见 `oxlint.config.ts`，启用 TypeScript、Vue 等内置规则插件。Oxfmt 配置见 `.oxfmtrc.json`，采用默认格式规则，并排除由 pnpm 管理的锁文件。生成目录通过 `.gitignore` 排除。

Oxlint 对 Vue 文件的检查范围为脚本部分，`pnpm typecheck` 补充 Vue 模板与 TypeScript 类型检查。`nuxt.config.ts` 中的 `typescript.nodeTsConfig` 将根目录工具配置、`tests/unit` 与 `tests/e2e` 纳入同一检查；Nuxt 开发、构建与测试转译不代替类型检查。

TypeScript 暂固定在 6.x，以兼容当前 vue-tsc 所需的编译器 API；升级大版本前须验证 `pnpm typecheck`。

## 测试

测试配置见 `vitest.config.ts` 和 `playwright.config.ts`，按[Nuxt 测试指南](https://nuxt.com/docs/4.x/getting-started/testing)区分运行环境：

- `tests/unit/**/*.test.ts`：纯函数、数据 schema 等，不依赖 Nuxt，使用 Node 环境。
- `tests/nuxt/**/*.test.ts`：需要 Nuxt 自动导入、路由或组件挂载的测试，使用 Nuxt 与 happy-dom 环境。
- `tests/e2e/**/*.spec.ts`：Playwright 测试，针对构建后的静态站点运行。

目前尚无业务测试，`pnpm test` 与 `pnpm test:e2e` 显式允许空测试集。新增测试后会自动收集并执行。首次运行端到端测试前安装浏览器：

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright 使用 `127.0.0.1:4173` 启动独立预览服务，不复用已有服务。失败时在 `test-results/` 保留截图与 trace。端到端测试需要构建和浏览器，单独运行，不纳入提交 hook。

## 静态构建与预览

```sh
pnpm build
pnpm preview
```

`wrangler.jsonc` 只提供静态资源目录，按[Workers SSG 配置](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)将未知路径返回为 404。静态部署不提供运行时服务端 API；新增动态页面时，需要保证构建阶段能枚举或抓取对应路由。

当前配置用于本地验证和后续托管准备，未绑定 Cloudflare 账号、域名，也未发布。正式发布前确认部署目标。

## Git hooks

`pre-commit` 执行 `pnpm check`，检查整个工作树。检查失败会阻止提交，不会自动修复或暂存文件。

修改 `package.json` 中的 hooks 配置后运行 `pnpm prepare`。`preserveUnused` 保留未由本项目配置的其他 hooks。

同一仓库的多个 Git worktree 默认共用 hooks，检查在触发提交的工作树中执行；该工作树需要具备对应的配置和依赖。
