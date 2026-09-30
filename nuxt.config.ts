import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-09-25",
  modules: ["reka-ui/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Petit",
      htmlAttrs: { lang: "zh-CN" },
      meta: [
        {
          name: "description",
          content:
            "Petit 是一个非官方的《星布谷地》资料站，方便玩家查阅游戏信息。目前提供菜谱速查。",
        },
      ],
      link: [
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    nodeTsConfig: {
      compilerOptions: {
        paths: { "#shared/*": ["../shared/*"] },
      },
      include: [
        "../*.config.ts",
        "../scripts/**/*.ts",
        "../tests/unit/**/*.ts",
        "../tests/e2e/**/*.ts",
      ],
    },
  },
  nitro: {
    prerender: {
      failOnError: true,
    },
  },
});
