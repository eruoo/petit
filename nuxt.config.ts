import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-09-25",
  modules: ["reka-ui/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Petit",
      htmlAttrs: { lang: "zh-CN" },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    nodeTsConfig: {
      include: ["../*.config.ts", "../tests/unit/**/*.ts", "../tests/e2e/**/*.ts"],
    },
  },
  nitro: {
    prerender: {
      failOnError: true,
    },
  },
});
