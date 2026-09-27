import { recipeImageUrls } from "#build/recipe-image-urls";
import { recipeImagesById } from "#shared/recipes/images";
import type { RecipeImage } from "../../shared/recipes/images";

export type DisplayRecipeImage = RecipeImage & { url: string };

export function getRecipeImage(recipeId: string): DisplayRecipeImage | undefined {
  const image = recipeImagesById.get(recipeId);
  if (!image) return undefined;
  const url = recipeImageUrls[image.localPath];
  if (!url) throw new Error(`Missing local recipe image: ${image.localPath}`);
  return { ...image, url };
}
