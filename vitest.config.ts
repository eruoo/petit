import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: { "#shared": fileURLToPath(new URL("./shared", import.meta.url)) },
        },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["tests/nuxt/**/*.{test,spec}.ts"],
          environment: "nuxt",
        },
      }),
    ],
  },
});
