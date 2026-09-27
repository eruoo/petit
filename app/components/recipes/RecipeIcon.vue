<script setup lang="ts">
const paths = {
  search: ["m21 21-5-5", "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0"],
  book: ["M12 5v15", "M3 4c4-1 7-1 9 1 2-2 5-2 9-1v15c-4-1-7-1-9 1-2-2-5-2-9-1V4Z"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  arrow: ["M5 12h14", "m14 7 5 5-5 5"],
  pot: ["M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7Z", "M2 12h3m14 0h3M4 7h16M9 4h6M10 1v3m4-3v3"],
  glass: ["m6 8 2 13h8l2-13H6Z", "m13 8 2-6h5", "M6 12h12"],
  oven: ["M3 4h18v17H3V4Z", "M3 9h18M7 6.5h.1m4 0h.1", "M7 12h10v6H7v-6Z"],
  chevron: ["m9 5 7 7-7 7"],
  check: ["m5 12 4 4L19 6"],
  external: ["M14 3h7v7", "M21 3 11 13", "M10 3H3v18h18v-7"],
  reset: ["M3 10a9 9 0 1 1 2 9", "M3 3v7h7"],
  grid: ["M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z"],
  list: ["M9 5h12M9 12h12M9 19h12", "M3 5h.1M3 12h.1M3 19h.1"],
} as const;
defineProps<{ name: keyof typeof paths }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(path, index) in paths[name]" :key="index" :d="path" />
  </svg>
</template>
