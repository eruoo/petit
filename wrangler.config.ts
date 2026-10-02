import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({
  // cf 的静态资源构建适配层；部署与路由设置由 cloudflare.config.ts 维护。
  assetsDirectory: "./.output/public",
  dev: {
    ip: "127.0.0.1",
  },
  // 仅发布静态资源，没有需要生成绑定类型的 Worker 代码。
  types: {
    generate: false,
  },
});
