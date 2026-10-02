import { defineConfig } from "cf/config";
import { siteMetadata } from "./shared/site.ts";

export default defineConfig({
  worker: {
    name: "petit",
    compatibilityDate: "2026-09-25",
    domains: [new URL(siteMetadata.origin).hostname],
    assets: {
      htmlHandling: "drop-trailing-slash",
      notFoundHandling: "404-page",
    },
  },
});
