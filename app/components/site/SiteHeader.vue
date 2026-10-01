<template>
  <header class="site-header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand" aria-label="Petit 首页">
        <img class="brand-icon" src="/brand-mark.svg" width="44" height="44" alt="" />
        <span>Petit<span class="brand-dot">.</span></span>
      </NuxtLink>
      <div class="header-context">
        <span>星布谷地</span><span class="context-divider" /><span>资料手册</span>
      </div>
      <nav class="site-nav" aria-label="主导航">
        <NuxtLink to="/" exact-active-class="is-current">菜谱</NuxtLink>
        <NuxtLink to="/about" exact-active-class="is-current">关于</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid color-mix(in srgb, var(--petit-color-border-strong) 20%, transparent);
}
.header-inner {
  width: min(1344px, calc(100% - 96px));
  margin: auto;
  display: flex;
  height: 82px;
  align-items: center;
  gap: 3rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: var(--petit-color-foreground-heading);
}
.brand-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.brand-dot {
  color: var(--petit-color-link);
}
.header-context {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.73rem;
  color: var(--petit-color-foreground-muted);
}
.context-divider {
  width: 1px;
  height: 12px;
  background: color-mix(in srgb, var(--petit-color-border-strong) 30%, transparent);
}
.site-nav {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--petit-color-foreground-muted);
}
.site-nav a {
  display: flex;
  align-items: center;
  min-height: 44px;
  border-bottom: 2px solid transparent;
}
.site-nav a:hover,
.site-nav .is-current {
  color: var(--petit-color-foreground-heading);
}
.site-nav .is-current {
  border-bottom-color: var(--petit-color-border-selected);
}
@media (max-width: 900px) {
  .header-inner {
    width: calc(100% - 48px);
  }
}
@media (max-width: 600px) {
  .header-inner {
    height: 67px;
    gap: 1.5rem;
  }
  .header-context {
    display: none;
  }
  .brand {
    font-size: 1.8rem;
  }
  .brand-icon {
    width: 38px;
    height: 38px;
  }
  .site-nav {
    gap: 1.4rem;
  }
}
</style>
