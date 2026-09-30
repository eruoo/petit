import { aboutPageMetadata, siteMetadata } from "#shared/site";

export function useSiteSeo() {
  const route = useRoute();
  const siteUrl = useRuntimeConfig().public.siteUrl;
  const pageMetadata = computed(() =>
    route.path.replace(/\/$/, "") === "/about" ? aboutPageMetadata : siteMetadata,
  );
  // 搜索、排序与视图参数只改变菜谱展示，不创建独立页面。
  const canonicalUrl = computed(() => {
    if (!siteUrl) return undefined;
    const path = route.path.replace(/\/$/, "") || "/";
    return new URL(path, siteUrl).href;
  });
  const imageUrl = siteUrl ? new URL(siteMetadata.image.path, siteUrl).href : undefined;

  useSeoMeta({
    title: () => pageMetadata.value.title,
    description: () => pageMetadata.value.description,
    ogTitle: () => pageMetadata.value.title,
    ogDescription: () => pageMetadata.value.description,
    ogType: "website",
    ogSiteName: siteMetadata.name,
    ogLocale: "zh_CN",
    ogUrl: () => canonicalUrl.value,
    ogImage: imageUrl,
    ogImageType: imageUrl ? "image/png" : undefined,
    ogImageWidth: imageUrl ? siteMetadata.image.width : undefined,
    ogImageHeight: imageUrl ? siteMetadata.image.height : undefined,
    ogImageAlt: imageUrl ? siteMetadata.image.alt : undefined,
    twitterCard: "summary_large_image",
    twitterTitle: () => pageMetadata.value.title,
    twitterDescription: () => pageMetadata.value.description,
    twitterImage: imageUrl,
    twitterImageAlt: imageUrl ? siteMetadata.image.alt : undefined,
  });

  useHead(() => ({
    link: canonicalUrl.value ? [{ rel: "canonical", href: canonicalUrl.value }] : [],
  }));
}
