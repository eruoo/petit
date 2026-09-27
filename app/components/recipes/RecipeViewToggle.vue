<script setup lang="ts">
import type { RecipeView } from "../../utils/recipes";
import RecipeIcon from "./RecipeIcon.vue";

const view = defineModel<RecipeView>({ required: true });
defineProps<{ disabled: boolean }>();
const options = [
  { value: "grid", label: "图标" },
  { value: "list", label: "列表" },
] as const;
</script>

<template>
  <div class="view-toggle" role="group" aria-label="菜谱视图">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :disabled="disabled"
      :aria-label="`${option.label}视图`"
      :aria-pressed="view === option.value"
      @click="view = option.value"
    >
      <RecipeIcon :name="option.value" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.view-toggle {
  display: inline-flex;
  flex-shrink: 0;
  padding: 3px;
  gap: 2px;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  border-radius: 0.6rem;
}
.view-toggle button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 38px;
  padding: 0.4rem 0.65rem;
  border-radius: 0.35rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.73rem;
  transition: background 0.15s ease;
}
.view-toggle button:hover {
  background: var(--petit-color-surface-hover);
}
.view-toggle button[aria-pressed="true"] {
  background: var(--petit-color-primary);
  color: var(--petit-color-on-primary);
  font-weight: 700;
}
.view-toggle svg {
  width: 16px;
  height: 16px;
}
</style>
