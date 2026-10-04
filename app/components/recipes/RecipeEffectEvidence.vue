<script setup lang="ts">
import { computed } from "vue";
import type { Recipe } from "../../../shared/recipes/schema";
import { getEffectEvidence } from "#shared/recipes/effects";
import { primaryRecipeSource, supplementalRecipeSource } from "#shared/recipes/primary";

const props = defineProps<{ recipe: Recipe }>();
const evidence = computed(() => getEffectEvidence(props.recipe));
const isFree = computed(() => props.recipe.source.region === "free");
const isMiracle = computed(() => props.recipe.source.region === "miracle");
const miracleNotes = supplementalRecipeSource.notes.filter(
  (note) => note.appliesTo.length === 1 && note.appliesTo.includes("miracle"),
);
const freeCookingNotes = primaryRecipeSource.notes.filter(
  (note) => note.appliesTo.length === 1 && note.appliesTo.includes("free"),
);
</script>

<template>
  <div v-if="evidence" class="effect-evidence">
    <p v-if="evidence.description" class="effect-description">
      {{ evidence.description.descriptionRaw }}
    </p>
  </div>
  <div v-else-if="isFree" class="effect-evidence">
    <p>什锦系列的具体特殊效果与阶级未说明。</p>
    <p v-for="note in freeCookingNotes" :key="note.id" class="evidence-note">{{ note.raw }}</p>
  </div>
  <div v-else-if="isMiracle" class="effect-evidence">
    <p v-for="note in miracleNotes" :key="note.id">{{ note.raw }}</p>
    <p class="evidence-note">固定食材、厨具与具体特殊效果未说明。</p>
  </div>
</template>

<style scoped>
.effect-evidence {
  margin-top: 0.8rem;
  font-size: 0.8rem;
  line-height: 1.8;
}
.effect-evidence p + p {
  margin-top: 0.45rem;
}
.evidence-note {
  color: var(--petit-color-foreground-muted);
  font-size: 0.73rem;
}
</style>
