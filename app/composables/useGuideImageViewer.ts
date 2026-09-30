import { onBeforeUnmount, ref, type Ref } from "vue";
import type Viewer from "viewerjs";

export function useGuideImageViewer(gallery: Readonly<Ref<HTMLElement | null>>) {
  const loading = ref(false);
  const failed = ref(false);
  let viewer: Viewer | undefined;
  let host: HTMLElement | undefined;
  let trigger: HTMLElement | undefined;
  let originalLink: HTMLAnchorElement | undefined;
  let caption = "";
  let disposed = false;

  function prepareControls() {
    if (!host) return;
    const labels = {
      "zoom-in": "放大",
      "zoom-out": "缩小",
      "one-to-one": "原尺寸",
      reset: "适应屏幕",
      prev: "上一张",
      next: "下一张",
    };
    for (const [action, label] of Object.entries(labels)) {
      const control = host.querySelector<HTMLElement>(`.viewer-toolbar .viewer-${action}`);
      if (!control) continue;
      control.textContent = label;
      control.setAttribute("aria-label", label);
      control.title = label;
    }
    const close = host.querySelector<HTMLElement>(".viewer-button");
    if (close) {
      close.textContent = "×";
      close.setAttribute("aria-label", "关闭图片预览");
      close.title = "关闭图片预览（Esc）";
    }
    originalLink = document.createElement("a");
    originalLink.className = "viewer-open-original";
    originalLink.textContent = "打开原图";
    originalLink.target = "_blank";
    originalLink.rel = "noopener";
    host.querySelector(".viewer-open-original")?.replaceWith(originalLink);
    host.addEventListener("keydown", handleKeyboard);
  }

  function handleKeyboard(event: KeyboardEvent) {
    if (!host) return;
    // Viewer.js 的自定义工具栏使用 role=button；补齐键盘激活与 Tab 循环。
    if ((event.key === " " || event.key === "Enter") && event.target instanceof HTMLElement) {
      if (event.target.getAttribute("role") === "button") {
        event.preventDefault();
        event.stopPropagation();
        event.target.click();
      }
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      host.querySelectorAll<HTMLElement>('[tabindex="0"]:not([aria-disabled="true"]), a[href]'),
    ).filter((element) => element.getClientRects().length > 0);
    const current = controls.indexOf(document.activeElement as HTMLElement);
    if (!controls.length) return;
    event.preventDefault();
    const next =
      current < 0
        ? event.shiftKey
          ? controls.length - 1
          : 0
        : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[next]?.focus();
  }

  function updateImage(event: Viewer.ViewEvent) {
    const { originalImage, index } = event.detail;
    caption = originalImage.dataset.caption ?? originalImage.alt;
    if (originalLink) originalLink.href = originalImage.src;
    const count = gallery.value?.querySelectorAll("img").length ?? 0;
    for (const [action, disabled] of [
      ["prev", index === 0],
      ["next", index === count - 1],
    ] as const) {
      const control = host?.querySelector<HTMLElement>(`.viewer-toolbar .viewer-${action}`);
      control?.setAttribute("aria-disabled", String(disabled));
      control?.setAttribute("tabindex", disabled ? "-1" : "0");
    }
  }

  async function openPreview(event: MouseEvent, index: number) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (loading.value || !gallery.value) return;
    trigger = event.currentTarget as HTMLElement;
    failed.value = false;
    loading.value = true;
    try {
      if (!viewer) {
        const { default: ImageViewer } = await import("viewerjs");
        if (disposed || !gallery.value) return;
        host = document.createElement("div");
        document.body.appendChild(host);
        viewer = new ImageViewer(gallery.value, {
          container: host,
          className: "guide-image-viewer",
          navbar: false,
          navigation: false,
          loop: false,
          // Viewer.js 1.15.0 在非循环首尾预加载时会越界；禁用相邻图片预加载。
          preload: false,
          rotatable: false,
          scalable: false,
          slideOnTouch: false,
          slideOnWheel: false,
          maxZoomRatio: 4,
          // Viewer.js 在 shown 后绑定关闭事件；跳过开场过渡，出现时即可操作。
          transition: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? false
            : { show: false },
          title: () => caption,
          toolbar: {
            zoomIn: true,
            zoomOut: true,
            oneToOne: { click: () => viewer?.zoomTo(1, true) },
            reset: true,
            prev: true,
            next: true,
            openOriginal: true,
          },
          ready: prepareControls,
          view: updateImage,
          hidden: () => {
            if (!disposed && trigger?.isConnected) trigger.focus({ preventScroll: true });
          },
        });
      }
      viewer.view(index);
    } catch {
      viewer?.destroy();
      viewer = undefined;
      host?.remove();
      host = undefined;
      failed.value = true;
    } finally {
      loading.value = false;
    }
  }

  onBeforeUnmount(() => {
    disposed = true;
    viewer?.destroy();
    host?.remove();
  });

  return { openPreview, loading, failed };
}
