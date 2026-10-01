import tailwindcss from "@tailwindcss/vite";
import { siteMetadata } from "./shared/site";

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL?.trim() ?? siteMetadata.origin;
if (siteUrl) {
  const url = new URL(siteUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NUXT_PUBLIC_SITE_URL must be an HTTP(S) origin, such as https://petit.eruoo.dev",
    );
  }
}

export default defineNuxtConfig({
  compatibilityDate: "2026-09-25",
  modules: ["reka-ui/nuxt"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: { siteUrl },
  },
  app: {
    head: {
      title: "Petit",
      htmlAttrs: { lang: "zh-CN" },
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/brand-mark.svg" },
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
