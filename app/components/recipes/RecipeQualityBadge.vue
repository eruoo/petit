<script setup lang="ts">
import { recipeQualityLabel } from "#shared/recipes/qualities";
import type { RecipeQuality } from "../../../shared/recipes/qualities";

defineProps<{ quality?: RecipeQuality }>();
</script>

<template>
  <span
    class="quality-badge dish-quality"
    :data-quality="quality && quality.status !== 'unknown' ? quality.color : 'unknown'"
    >{{ recipeQualityLabel(quality) }}</span
  >
</template>

<style scoped>
.quality-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--dish-quality-foreground, var(--petit-color-foreground-muted));
  font-size: 0.68rem;
  line-height: 1.6;
}
.quality-badge::before {
  content: "";
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
</style>
