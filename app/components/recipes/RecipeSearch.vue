<script setup lang="ts">
import RecipeIcon from "./RecipeIcon.vue";

const query = defineModel<string>({ required: true });
defineProps<{ disabled: boolean }>();
</script>

<template>
  <div class="search-field">
    <RecipeIcon name="search" />
    <label class="sr-only" for="recipe-search">搜索菜名、食材、词条或烹饪方式</label>
    <input
      id="recipe-search"
      v-model="query"
      :disabled="disabled"
      type="search"
      autocomplete="off"
      placeholder="菜名、食材、词条、烹饪方式，空格分隔"
    />
    <button
      v-if="query"
      type="button"
      class="icon-button clear-search"
      :disabled="disabled"
      aria-label="清空搜索"
      @click="query = ''"
    >
      <RecipeIcon name="close" />
    </button>
  </div>
</template>

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 54px;
  background: color-mix(in srgb, var(--petit-color-border) 50%, var(--petit-color-background));
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 55%, transparent);
  border-radius: 0.6rem;
  padding: 0 1rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.search-field:focus-within {
  border-color: var(--petit-color-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--petit-color-focus) 20%, transparent);
}
.search-field > svg {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  color: var(--petit-color-foreground-muted);
}
.search-field input {
  flex: 1;
  min-width: 0;
  padding: 0.9rem 0;
  background: transparent;
  font-size: 0.86rem;
  outline: none;
}
.search-field input::-webkit-search-cancel-button {
  display: none;
}
.search-field input::placeholder {
  color: var(--petit-color-foreground-muted);
  opacity: 0.95;
}
.clear-search {
  margin-right: -0.6rem;
}
@media (max-width: 600px) {
  .search-field {
    padding: 0 0.75rem;
  }
  .search-field input {
    font-size: 16px;
  }
}
</style>
