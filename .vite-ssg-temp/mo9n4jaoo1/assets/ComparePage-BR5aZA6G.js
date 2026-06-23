import { defineComponent, ref, computed, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderComponent, ssrRenderStyle } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { i as injectFontFace, f as fetchCoverage } from "./useCoverage-BKNfcfvg.js";
import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
let fontsCache = null;
let metadataCache = null;
async function loadFontsRegistry() {
  if (fontsCache) return fontsCache;
  fontsCache = await fetchJson("fonts.json");
  return fontsCache;
}
async function loadFontMetadata() {
  if (metadataCache) return metadataCache;
  metadataCache = await fetchJson("font-metadata.json");
  return metadataCache;
}
const SPECIMEN_DEFAULT = "Finding efficient flow · 0123456789";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ComparePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const router = useRouter();
    const allFonts = ref([]);
    const availableSlugs = ref(/* @__PURE__ */ new Set());
    const columns = ref([]);
    const searchText = ref("");
    const loadingRegistry = ref(true);
    const specimenText = ref(SPECIMEN_DEFAULT);
    const slugsFromUrl = computed(() => {
      const param = route.params.fonts;
      if (!param) return [];
      return param.split(",").filter(Boolean).slice(0, 4);
    });
    const fontNames = computed(() => allFonts.value.map((f) => `${f.name} (${f.slug})`).sort());
    async function loadRegistry() {
      loadingRegistry.value = true;
      try {
        const data = await loadFontsRegistry();
        allFonts.value = data.fonts.map((f) => ({
          slug: f.slug,
          name: f.canonical_name,
          formulas: f.formulas,
          styleCount: f.style_count
        }));
        const meta = await loadFontMetadata();
        availableSlugs.value = new Set(meta.fonts.map((f) => f.slug));
      } catch (e) {
        console.error("Failed to load font registry", e);
      } finally {
        loadingRegistry.value = false;
      }
    }
    async function addFont(slug) {
      var _a;
      if (columns.value.length >= 4) return;
      if (columns.value.some((c) => c.slug === slug)) return;
      if (!availableSlugs.value.has(slug)) return;
      const entry = allFonts.value.find((f) => f.slug === slug);
      const { fontId } = injectFontFace(slug, `fonts/${slug}.woff`);
      const col = {
        slug,
        name: (entry == null ? void 0 : entry.name) || slug,
        fontId,
        coverage: null,
        weight: 400,
        weightMin: 100,
        weightMax: 900,
        loading: true
      };
      columns.value.push(col);
      col.coverage = await fetchCoverage(slug);
      if ((_a = col.coverage) == null ? void 0 : _a.variable_axes) {
        const wght = col.coverage.variable_axes.find((a) => a.tag === "wght");
        if (wght) {
          col.weightMin = wght.min;
          col.weightMax = wght.max;
          col.weight = wght.default;
        }
      }
      col.loading = false;
      updateUrl();
    }
    function updateUrl() {
      const slugs = columns.value.map((c) => c.slug).join(",");
      const path = slugs ? `/compare/${slugs}` : "/compare";
      router.replace(path);
    }
    function specimenStyle(col) {
      const s = { fontFamily: `'${col.fontId}', sans-serif` };
      if (col.weight && col.weight !== 400) {
        s.fontWeight = String(col.weight);
        s.fontVariationSettings = `"wght" ${col.weight}`;
      }
      return s;
    }
    [__temp, __restore] = withAsyncContext(() => loadRegistry()), await __temp, __restore();
    for (const slug of slugsFromUrl.value) {
      [__temp, __restore] = withAsyncContext(() => addFont(slug)), await __temp, __restore();
    }
    useHead({
      title: "Compare Fonts — Fontist",
      meta: [
        { name: "description", content: "Compare up to four fonts side by side. Specimen text, weight axes, and Unicode coverage comparison." },
        { property: "og:title", content: "Compare Fonts — Fontist" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/compare" }
      ]
    });
    watch(slugsFromUrl, (newSlugs) => {
      const current = columns.value.map((c) => c.slug);
      if (JSON.stringify(current) !== JSON.stringify(newSlugs)) {
        columns.value = [];
        for (const slug of newSlugs) {
          addFont(slug);
        }
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "cmp" }, _attrs))} data-v-8c513f7f><header class="cmp-header" data-v-8c513f7f><h1 class="cmp-title" data-v-8c513f7f>Compare Fonts</h1><p class="cmp-subtitle" data-v-8c513f7f>Side-by-side specimen comparison — select up to 4 fonts</p></header><div class="cmp-selector" data-v-8c513f7f><input${ssrRenderAttr("value", searchText.value)} list="font-list" placeholder="Type a font name or slug…" class="cmp-search" data-v-8c513f7f><datalist id="font-list" data-v-8c513f7f><!--[-->`);
      ssrRenderList(fontNames.value, (name) => {
        _push(`<option${ssrRenderAttr("value", name)} data-v-8c513f7f></option>`);
      });
      _push(`<!--]--></datalist><button class="cmp-add-btn"${ssrIncludeBooleanAttr(!searchText.value.trim() || columns.value.length >= 4) ? " disabled" : ""} data-v-8c513f7f>Add</button><span class="cmp-count" data-v-8c513f7f>${ssrInterpolate(columns.value.length)}/4 selected</span></div>`);
      if (columns.value.length > 0) {
        _push(`<div class="cmp-specimen-bar" data-v-8c513f7f><label class="cmp-specimen-label" data-v-8c513f7f>Shared specimen text</label><input${ssrRenderAttr("value", specimenText.value)} class="cmp-specimen-input" data-v-8c513f7f></div>`);
      } else {
        _push(`<!---->`);
      }
      if (columns.value.length === 0 && !loadingRegistry.value) {
        _push(`<div class="cmp-empty" data-v-8c513f7f><p class="cmp-empty-text" data-v-8c513f7f>No fonts selected. Search above to add fonts for comparison.</p>`);
        if (availableSlugs.value.size > 0) {
          _push(`<div class="cmp-suggestions" data-v-8c513f7f><p class="cmp-suggestion-label" data-v-8c513f7f>Try:</p><!--[-->`);
          ssrRenderList(["inter", "abel", "acme", "alegreya"].filter((s) => availableSlugs.value.has(s)).slice(0, 4), (slug) => {
            _push(`<button class="cmp-suggestion" data-v-8c513f7f>${ssrInterpolate(slug)}</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (loadingRegistry.value) {
        _push(`<div class="cmp-loading" data-v-8c513f7f>Loading font registry…</div>`);
      } else {
        _push(`<!---->`);
      }
      if (columns.value.length > 0) {
        _push(`<div class="cmp-columns" data-v-8c513f7f><!--[-->`);
        ssrRenderList(columns.value, (col) => {
          var _a, _b;
          _push(`<div class="cmp-col" data-v-8c513f7f><div class="cmp-col-head" data-v-8c513f7f>`);
          _push(ssrRenderComponent(unref(RouterLink), {
            to: `/font/${col.slug}`,
            class: "cmp-col-name"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(col.name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(col.name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<button class="cmp-remove" data-v-8c513f7f>×</button></div><code class="cmp-col-slug" data-v-8c513f7f>${ssrInterpolate(col.slug)}</code><div class="cmp-specimen-hero" style="${ssrRenderStyle(specimenStyle(col))}" data-v-8c513f7f>${ssrInterpolate(specimenText.value)}</div>`);
          if (col.weightMax > col.weightMin) {
            _push(`<div class="cmp-weight" data-v-8c513f7f><label data-v-8c513f7f><span data-v-8c513f7f>Weight</span><span class="cmp-weight-val" data-v-8c513f7f>${ssrInterpolate(col.weight)}</span></label><input type="range"${ssrRenderAttr("min", col.weightMin)}${ssrRenderAttr("max", col.weightMax)}${ssrRenderAttr("value", col.weight)} class="cmp-slider" data-v-8c513f7f></div>`);
          } else {
            _push(`<!---->`);
          }
          if (col.coverage && !col.loading) {
            _push(`<div class="cmp-stats" data-v-8c513f7f><div class="cmp-stat" data-v-8c513f7f><span class="cmp-stat-num" data-v-8c513f7f>${ssrInterpolate((_a = col.coverage.total_codepoints) == null ? void 0 : _a.toLocaleString())}</span><span class="cmp-stat-label" data-v-8c513f7f>codepoints</span></div><div class="cmp-stat" data-v-8c513f7f><span class="cmp-stat-num" data-v-8c513f7f>${ssrInterpolate(col.coverage.supported_blocks)}</span><span class="cmp-stat-label" data-v-8c513f7f>blocks</span></div>`);
            if ((_b = col.coverage.opentype_features) == null ? void 0 : _b.length) {
              _push(`<div class="cmp-stat" data-v-8c513f7f><span class="cmp-stat-num" data-v-8c513f7f>${ssrInterpolate(col.coverage.opentype_features.length)}</span><span class="cmp-stat-label" data-v-8c513f7f>OT features</span></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(ssrRenderComponent(unref(RouterLink), {
            to: `/font/${col.slug}/unicode`,
            class: "cmp-cov-link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`Unicode coverage →`);
              } else {
                return [
                  createTextVNode("Unicode coverage →")
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/ComparePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ComparePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-8c513f7f"]]);
export {
  ComparePage as default
};
