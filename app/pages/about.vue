<script setup lang="ts">
import AboutContent from "../components/about/AboutContent.vue";
import { aboutPageMetadata } from "#shared/site";

useSiteSeo(aboutPageMetadata);
</script>

<template>
  <AboutContent />
</template>
