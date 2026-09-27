import { resolve } from "node:path";
import { addTemplate, defineNuxtModule } from "nuxt/kit";
import { recipeImages } from "../shared/recipes/images.ts";

export default defineNuxtModule({
  setup(_options, nuxt) {
    // 导入范围来自同一份已校验候选，完整归档不等于页面所需资源。
    const paths = [...new Set(recipeImages.map((image) => image.localPath))];
    addTemplate({
      filename: "recipe-image-urls.ts",
      write: true,
      getContents: () =>
        [
          ...paths.map(
            (path, index) =>
              `import image${index} from ${JSON.stringify(`${resolve(nuxt.options.rootDir, path)}?url`)};`,
          ),
          "export const recipeImageUrls: Record<string, string> = {",
          ...paths.map((path, index) => `  ${JSON.stringify(path)}: image${index},`),
          "};",
        ].join("\n"),
    });
  },
});
