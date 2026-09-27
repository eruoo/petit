<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import type { Recipe } from "../../../shared/recipes/schema";
import { recipeDataset } from "#shared/recipes/index";
import { collectRecipeReviewItems } from "#shared/recipes/review";
import { imageStatusLabels } from "#shared/recipes/images";
import { recipeQualitiesById } from "#shared/recipes/qualities";
import { getRecipeSourceImageUrl } from "../../utils/recipe-sources";
import { effectSummary, regionLabels } from "../../utils/recipes";
import { getRecipeImage } from "../../utils/recipe-images";
import IngredientSlots from "./IngredientSlots.vue";
import RecipeIcon from "./RecipeIcon.vue";
import RecipeImage from "./RecipeImage.vue";
import RecipeQualityBadge from "./RecipeQualityBadge.vue";
import RecipeQualityDetails from "./RecipeQualityDetails.vue";

const props = defineProps<{ recipe: Recipe | null; open: boolean }>();
const emit = defineEmits<{ "update:open": [open: boolean]; restoreFocus: [] }>();
const sourceExpanded = shallowRef(false);
watch(
  () => props.recipe?.id,
  () => {
    sourceExpanded.value = false;
  },
);
const source = computed(() =>
  recipeDataset.sources.find((item) => item.id === props.recipe?.source.sourceId),
);
const originalImageUrl = computed(() =>
  source.value ? getRecipeSourceImageUrl(source.value) : undefined,
);
const sourceRow = computed(() =>
  recipeDataset.inventory.regions
    .find((region) => region.id === props.recipe?.source.region)
    ?.rows.find((row) => row.row === props.recipe?.source.row),
);
const effect = computed(() => (props.recipe ? effectSummary(props.recipe) : null));
const dishImage = computed(() => (props.recipe ? getRecipeImage(props.recipe.id) : undefined));
const dishQuality = computed(() =>
  props.recipe ? recipeQualitiesById.get(props.recipe.id) : undefined,
);
const notes = computed(
  () => source.value?.notes.filter((note) => props.recipe?.noteIds.includes(note.id)) ?? [],
);
const accessNotes = computed(() => notes.value.filter((note) => note.appliesTo.length === 1));
const reviews = computed(() =>
  props.recipe
    ? collectRecipeReviewItems([props.recipe])
        .filter((item) => item.status !== "unresolved")
        .map((item) => ({ ...item, label: fieldLabel(item.field) }))
    : [],
);
const colorLabels = { blue: "蓝色底", purple: "紫色底", yellow: "黄色底" };
function fieldLabel(field: string) {
  const ingredient = /^ingredients\.(\d+)/u.exec(field);
  if (ingredient) return `食材 ${Number(ingredient[1]) + 1}`;
  return (
    (
      {
        name: "菜名",
        cookingMethod: "烹饪方式",
        energy: "增加力气",
        specialEffect: "特殊效果",
        tags: "词条",
      } as Record<string, string>
    )[field] ?? "配方"
  );
}
function restoreFocus(event: Event) {
  event.preventDefault();
  emit("restoreFocus");
}
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="recipe-overlay" />
      <DialogContent class="recipe-dialog" @close-auto-focus="restoreFocus">
        <template v-if="recipe && source">
          <div class="dialog-header">
            <RecipeImage
              class="detail-image"
              :image="dishImage"
              :name="recipe.name.raw"
              :quality="dishQuality"
              eager
            />
            <div class="dialog-heading">
              <span class="dialog-eyebrow"
                >{{ regionLabels[recipe.source.region] }}<span> / </span>第
                {{ recipe.source.row }} 行</span
              >
              <DialogTitle class="dialog-title">{{ recipe.name.raw }}</DialogTitle>
              <RecipeQualityBadge :quality="dishQuality" />
              <DialogDescription class="dialog-description"
                >玩家图片转录 · 尚未在游戏中验证</DialogDescription
              >
            </div>
            <DialogClose class="icon-button dialog-close" aria-label="关闭配方详情"
              ><RecipeIcon name="close"
            /></DialogClose>
          </div>
          <div class="dialog-body">
            <div v-for="note in accessNotes" :key="note.id" class="access-note">
              <span>玩家记录</span>{{ note.raw }}
            </div>
            <section class="detail-section">
              <div class="section-title">
                <h3>所需食材</h3>
                <span>{{ recipe.ingredients.length }} 个槽位 · 按原图顺序</span>
              </div>
              <IngredientSlots :recipe="recipe" expanded />
              <p v-if="source.ingredientQualityInterpretation" class="detail-muted">
                品质要求按原图食材底色标注；无底色的食材品质未说明。
              </p>
            </section>
            <dl class="recipe-facts">
              <div>
                <dt>烹饪方式</dt>
                <dd>{{ recipe.cookingMethod.raw || "未说明" }}</dd>
              </div>
              <div>
                <dt>增加力气</dt>
                <dd v-if="recipe.energy.status === 'recorded'" class="energy-value">
                  +{{ recipe.energy.value }}
                </dd>
                <dd v-else class="pending-text">
                  未知 <small>（原文 {{ recipe.energy.raw || "空白" }}）</small>
                </dd>
              </div>
              <div class="fact-tags">
                <dt>词条</dt>
                <dd>{{ recipe.tags.raw || "未说明" }}</dd>
              </div>
            </dl>
            <section class="effect-detail detail-section">
              <h3>
                {{
                  recipe.productionChance.status === "unspecified-probability"
                    ? "菜品产出"
                    : "特殊效果"
                }}
              </h3>
              <p class="effect-name">{{ effect?.label }}</p>
              <p class="detail-muted">
                {{ effect?.note || "图片未说明特殊效果。"
                }}<template v-if="recipe.productionChance.status === 'unspecified-probability'">
                  · 原文“概率出”描述菜品产出，不是效果触发。</template
                >
              </p>
              <p v-if="recipe.specialEffect.status === 'recorded'" class="raw-effect">
                原文：{{ recipe.specialEffect.raw }}
              </p>
            </section>
            <section v-if="reviews.length" class="review-section detail-section">
              <h3>待核对信息</h3>
              <ul>
                <li v-for="(review, index) in reviews" :key="index">
                  <span class="review-field"
                    >{{ review.label
                    }}<template v-if="review.raw"> · {{ review.raw }}</template></span
                  >
                  <p>{{ review.reason }}</p>
                </li>
              </ul>
            </section>
            <section class="source-section">
              <h3>配方来源</h3>
              <NuxtLink class="source-link source-about-link" :to="`/about#${source.id}`">
                查看资料说明与来源<RecipeIcon name="arrow" />
              </NuxtLink>
              <p class="detail-muted">
                {{ regionLabels[recipe.source.region] }}，第 {{ recipe.source.row }} 行 · 图片日期
                {{ source.imageDate.value }}。
              </p>
              <ul class="player-notes">
                <li v-for="note in notes" :key="note.id">玩家记录：{{ note.raw }}</li>
              </ul>
              <details
                :open="sourceExpanded"
                class="source-disclosure"
                @toggle="sourceExpanded = ($event.target as HTMLDetailsElement).open"
              >
                <summary>核对原图这一行</summary>
                <template v-if="sourceExpanded && sourceRow">
                  <p class="detail-muted preview-hint">保留原尺寸，可横向滚动查看整行。</p>
                  <div class="source-row-scroll" tabindex="0" aria-label="原图行，可横向滚动">
                    <div
                      class="source-row-crop"
                      :style="{
                        width: `${sourceRow.bounds[2]}px`,
                        height: `${sourceRow.bounds[3]}px`,
                      }"
                    >
                      <img
                        :src="originalImageUrl"
                        :alt="`原图${regionLabels[recipe.source.region]}第${recipe.source.row}行：${recipe.name.raw}`"
                        :width="source.asset.width"
                        :height="source.asset.height"
                        :style="{
                          left: `-${sourceRow.bounds[0]}px`,
                          top: `-${sourceRow.bounds[1]}px`,
                        }"
                      />
                    </div>
                  </div>
                  <a class="source-link" :href="originalImageUrl" target="_blank" rel="noopener"
                    >打开完整原图<RecipeIcon name="external"
                  /></a>
                </template>
              </details>
              <details class="source-disclosure">
                <summary>原图颜色与加粗</summary>
                <p v-if="source.ingredientQualityInterpretation" class="detail-muted preview-hint">
                  食材底色按用户于
                  {{ source.ingredientQualityInterpretation.confirmedOn }} 补充的规则解释：“{{
                    source.ingredientQualityInterpretation.statementRaw
                  }}”。 黄色底色标为金色品质；无底色与加粗不作为品质要求。菜品品质另据 TapTap
                  图标圆底记录。
                </p>
                <p v-else class="detail-muted preview-hint">
                  配方附件中的表格底色与加粗尚无明确图例，食材品质保持未说明。菜品品质另据 TapTap
                  图标圆底记录。
                </p>
                <ul class="visual-cues">
                  <li v-for="(cue, index) in recipe.visualCues" :key="index">
                    <span>{{ fieldLabel(cue.field) }}</span
                    ><span v-if="cue.background" class="color-cue" :data-color="cue.background">{{
                      colorLabels[cue.background]
                    }}</span
                    ><span v-if="cue.bold">加粗</span>
                  </li>
                </ul>
              </details>
            </section>
            <section v-if="dishImage" class="image-source-section" aria-label="配图来源">
              <h3>
                配图来源 <span>{{ imageStatusLabels[dishImage.status] }}</span>
              </h3>
              <p class="detail-muted">
                {{ dishImage.sourceLabel
                }}<template v-if="dishImage.sourceLocation">
                  · {{ dishImage.sourceLocation }}</template
                >
              </p>
              <p
                v-if="dishImage.guideNameRaw && dishImage.guideNameRaw !== recipe.name.raw"
                class="detail-muted"
              >
                攻略图标注“{{ dishImage.guideNameRaw }}”，菜谱保留附件原文“{{ recipe.name.raw }}”。
              </p>
              <p v-for="note in dishImage.notes" :key="note" class="detail-muted">{{ note }}</p>
              <p class="detail-muted">配图对应关系尚未在游戏中验证。</p>
              <div class="image-source-links">
                <a
                  class="source-link"
                  :href="dishImage.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ dishImage.provider === "wiki" ? "Wiki 文件页" : "TapTap 原帖"
                  }}<RecipeIcon name="external" />
                </a>
                <a class="source-link" :href="dishImage.url" target="_blank" rel="noopener">
                  {{ dishImage.displayRegion ? "打开完整攻略图" : "打开配图原文件"
                  }}<RecipeIcon name="external" />
                </a>
              </div>
            </section>
            <RecipeQualityDetails :quality="dishQuality" />
          </div>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.recipe-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--petit-color-scrim);
}
.recipe-overlay[data-state="open"] {
  animation: overlay-in 0.18s ease-out;
}
.recipe-overlay[data-state="closed"] {
  animation: overlay-out 0.15s ease-in;
}
.recipe-dialog {
  --dialog-y: -50%;
  position: fixed;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, var(--dialog-y));
  width: min(680px, calc(100vw - 40px));
  max-height: min(880px, calc(100svh - 64px));
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: var(--petit-color-background);
  box-shadow: 0 24px 90px rgb(37 42 40 / 22%);
  overflow: hidden;
}
.recipe-dialog[data-state="open"] {
  animation: dialog-in 0.2s ease-out;
}
.recipe-dialog[data-state="closed"] {
  animation: dialog-out 0.15s ease-in;
}
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.8rem 2rem 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 22%, transparent);
}
.detail-image {
  width: 112px;
  flex: 0 0 112px;
  align-self: center;
}
.dialog-heading {
  flex: 1;
  min-width: 0;
}
.dialog-eyebrow {
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  letter-spacing: 0.07em;
}
.dialog-eyebrow > span {
  margin: 0 0.4rem;
  opacity: 0.5;
}
.dialog-title {
  margin-top: 0.55rem;
  font-size: clamp(1.3rem, 4vw, 1.7rem);
  font-weight: 800;
  color: var(--petit-color-foreground-heading);
  letter-spacing: -0.035em;
  line-height: 1.45;
}
.dialog-description {
  margin-top: 0.5rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.73rem;
}
.dialog-close {
  flex-shrink: 0;
  margin: -0.25rem -0.5rem 0 0;
}
.dialog-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.5rem 2rem 2rem;
}
.detail-section {
  margin-bottom: 1.8rem;
}
.detail-section h3,
.source-section h3,
.image-source-section h3 {
  font-size: 0.85rem;
  font-weight: 750;
}
.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.section-title > span {
  font-size: 0.65rem;
  color: var(--petit-color-foreground-muted);
}
.recipe-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.9rem;
}
.recipe-facts dt {
  color: var(--petit-color-foreground-muted);
  font-size: 0.7rem;
  margin-bottom: 0.5rem;
}
.recipe-facts dd {
  font-size: 0.95rem;
}
.recipe-facts .energy-value {
  font-weight: 800;
  font-size: 1.2rem;
  line-height: 1;
}
.fact-tags {
  grid-column: 1 / -1;
}
.pending-text {
  color: var(--petit-color-warning);
}
.pending-text small {
  font-size: 0.73rem;
}
.effect-detail {
  padding: 1.2rem 1.3rem;
  background: var(--petit-color-surface-hover);
  border-radius: 0.65rem;
}
.effect-name {
  margin-top: 0.7rem;
  font-size: 1.05rem;
  font-weight: 700;
}
.detail-muted {
  font-size: 0.74rem;
  line-height: 1.9;
  color: var(--petit-color-foreground-muted);
  margin-top: 0.35rem;
}
.raw-effect {
  margin-top: 0.6rem;
  font-size: 0.7rem;
  color: var(--petit-color-foreground-muted);
}
.access-note {
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--petit-color-border-selected);
  background: var(--petit-color-surface-hover);
  font-size: 0.8rem;
  line-height: 1.8;
  margin-bottom: 1.6rem;
}
.access-note > span {
  display: block;
  font-size: 0.67rem;
  color: var(--petit-color-foreground-muted);
  margin-bottom: 0.3rem;
}
.review-section {
  padding-top: 0.2rem;
}
.review-section h3 {
  color: var(--petit-color-warning);
}
.review-section li {
  margin-top: 0.9rem;
  font-size: 0.76rem;
  line-height: 1.8;
}
.review-field {
  font-weight: 700;
}
.review-section li p {
  color: var(--petit-color-foreground-muted);
}
.source-section {
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  padding-top: 1.5rem;
}
.image-source-section {
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  padding-top: 1.3rem;
  margin-top: 0.5rem;
}
.image-source-section h3 > span {
  display: inline-block;
  margin-left: 0.5rem;
  color: var(--petit-color-foreground-muted);
  font-size: 0.68rem;
  font-weight: 400;
}
.image-source-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.25rem;
  margin-top: 0.85rem;
}
.source-about-link {
  margin-top: 0.8rem;
}
.player-notes {
  margin: 1rem 0;
  font-size: 0.73rem;
  line-height: 1.8;
  color: var(--petit-color-foreground-muted);
}
.player-notes li + li {
  margin-top: 0.35rem;
}
.source-disclosure {
  border-top: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 18%, transparent);
  padding: 0.9rem 0;
  font-size: 0.77rem;
}
.source-disclosure summary {
  cursor: pointer;
  font-weight: 600;
}
.preview-hint {
  margin-top: 0.75rem;
}
.source-row-scroll {
  margin: 0.75rem 0;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 25%, transparent);
  background: white;
}
.source-row-crop {
  position: relative;
  overflow: hidden;
}
.source-row-crop img {
  position: absolute;
  max-width: none;
}
.source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--petit-color-link);
  text-decoration: underline;
  text-underline-offset: 4px;
  font-size: 0.75rem;
}
.source-link svg {
  width: 13px;
  height: 13px;
}
.visual-cues {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
  margin-top: 0.7rem;
  font-size: 0.73rem;
}
.visual-cues li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.color-cue::before {
  content: "";
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 50%;
  margin-right: 0.3rem;
}
.color-cue[data-color="purple"]::before {
  background: #f5eafa;
}
.color-cue[data-color="blue"]::before {
  background: #dfebf4;
}
.color-cue[data-color="yellow"]::before {
  background: #f8fdcd;
}
@keyframes overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes dialog-in {
  from {
    opacity: 0;
    transform: translate(-50%, var(--dialog-y)) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, var(--dialog-y)) scale(1);
  }
}
@keyframes dialog-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: translate(-50%, var(--dialog-y)) scale(0.98);
  }
}
@media (max-width: 600px) {
  .recipe-dialog {
    --dialog-y: 0%;
    top: auto;
    bottom: 0;
    width: 100%;
    max-height: 92svh;
    border-radius: 18px 18px 0 0;
  }
  .dialog-header {
    padding: 1.4rem 1.25rem 1.2rem;
    gap: 0.8rem;
  }
  .detail-image {
    width: 76px;
    flex-basis: 76px;
  }
  .dialog-description {
    line-height: 1.7;
  }
  .dialog-body {
    padding: 1.35rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
  }
}
</style>
