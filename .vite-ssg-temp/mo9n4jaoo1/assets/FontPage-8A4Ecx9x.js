import { computed, reactive, defineComponent, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { useRoute, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { i as injectFontFace, f as fetchCoverage } from "./useCoverage-BKNfcfvg.js";
import { f as featureInfo } from "./constants-CAbDY4oD.js";
import { f as findFormula } from "./loader-BaXvckyu.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const state = reactive({
  axes: {},
  features: {}
});
function useFontVariation() {
  const variationCSS = computed(() => {
    const entries = Object.entries(state.axes);
    if (entries.length === 0) return void 0;
    return entries.map(([k, v]) => `'${k}' ${v}`).join(", ");
  });
  const featureCSS = computed(() => {
    const entries = Object.entries(state.features).filter(([, v]) => v === "on" || v === "off");
    if (entries.length === 0) return void 0;
    return entries.map(([k, v]) => `'${k}' ${v === "on" ? 1 : 0}`).join(", ");
  });
  function initAxes(axes) {
    for (const a of axes) {
      if (!(a.tag in state.axes)) state.axes[a.tag] = a.default;
    }
  }
  function initFeatures(features) {
    for (const f of features) {
      if (!(f.tag in state.features)) state.features[f.tag] = f.default || "off";
    }
  }
  function setAxis(tag, value) {
    state.axes[tag] = value;
  }
  function toggleFeature(tag) {
    state.features[tag] = state.features[tag] === "on" ? "off" : "on";
  }
  return { state, variationCSS, featureCSS, initAxes, initFeatures, setAxis, toggleFeature };
}
const HERO_SPECIMEN = "Finding efficient flow";
const BODY_SPECIMEN = "fluffy fish affords fine flavor · whereas recognition of inherent dignity";
const LIGATURE_SPECIMEN = "ff fi fl ffi ffl";
const NUMBER_SPECIMEN = "0123456789";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FontPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const { state: state2, variationCSS, featureCSS, initAxes, initFeatures } = useFontVariation();
    const formula = ref(null);
    const coverage = ref(null);
    const loading = ref(true);
    const fontReady = ref(false);
    const fontId = ref("");
    async function loadData() {
      var _a, _b;
      loading.value = true;
      const s = slug.value;
      if (!s) {
        loading.value = false;
        return;
      }
      try {
        formula.value = await findFormula(s);
        const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff`, true);
        fontId.value = fid;
        fontReady.value = ensureInjected();
        coverage.value = await fetchCoverage(s);
        if ((_a = coverage.value) == null ? void 0 : _a.variable_axes)
          initAxes(coverage.value.variable_axes.map((a) => ({ tag: a.tag, default: a.default })));
        if ((_b = coverage.value) == null ? void 0 : _b.opentype_features)
          initFeatures(coverage.value.opentype_features.map((f) => ({ tag: f.tag })));
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch(slug, loadData);
    useHead(() => {
      var _a;
      return {
        title: formula.value ? `${formula.value.name} — Font Specimen` : "Font Specimen — Fontist",
        meta: [
          { property: "og:title", content: ((_a = formula.value) == null ? void 0 : _a.name) || "Fontist Font" },
          { property: "og:type", content: "website" },
          {
            name: "description",
            content: formula.value ? `${formula.value.name} font specimen, Unicode coverage, variable axes, and OpenType features. Install with: fontist install ${formula.value.formulaName || formula.value.slug}.` : "Interactive font specimen with Unicode coverage and OpenType features."
          }
        ],
        link: [
          { rel: "canonical", href: `https://www.fontist.org/font/${slug.value}` }
        ]
      };
    });
    const familyName = computed(() => {
      var _a;
      return ((_a = formula.value) == null ? void 0 : _a.name) || slug.value;
    });
    const licenseName = computed(() => {
      var _a;
      return ((_a = formula.value) == null ? void 0 : _a.licenseName) || "Unknown";
    });
    const axes = computed(() => {
      var _a;
      return ((_a = coverage.value) == null ? void 0 : _a.variable_axes) || [];
    });
    const features = computed(() => {
      var _a;
      return ((_a = coverage.value) == null ? void 0 : _a.opentype_features) || [];
    });
    computed(() => axes.value.find((a) => a.tag === "wght"));
    const specimenStyle = computed(() => {
      const s = { fontFamily: `'${fontId.value}', sans-serif` };
      if (variationCSS.value) s.fontVariationSettings = variationCSS.value;
      if (featureCSS.value) s.fontFeatureSettings = featureCSS.value;
      return s;
    });
    const cpCount = computed(() => {
      var _a, _b;
      return ((_b = (_a = coverage.value) == null ? void 0 : _a.total_codepoints) == null ? void 0 : _b.toLocaleString()) || "—";
    });
    const blockCount = computed(() => {
      var _a;
      return ((_a = coverage.value) == null ? void 0 : _a.supported_blocks) || 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (!loading.value && formula.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fp" }, _attrs))} data-v-00fae7a8><header class="fp-header" data-v-00fae7a8><div class="fp-title-row" data-v-00fae7a8><h1 class="fp-name" data-v-00fae7a8>${ssrInterpolate(familyName.value)}</h1><span class="fp-license" data-v-00fae7a8>${ssrInterpolate(licenseName.value)}</span></div><nav class="fp-nav" data-v-00fae7a8>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/font/${slug.value}/unicode`,
          class: "fp-nav-link"
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
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/formula/${slug.value}`,
          class: "fp-nav-link fp-nav-link--muted"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Formula details →`);
            } else {
              return [
                createTextVNode("Formula details →")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</nav></header>`);
        if (fontReady.value) {
          _push(`<section class="fp-hero" data-v-00fae7a8><div class="fp-specimen-hero"${ssrRenderAttr("contenteditable", true)} style="${ssrRenderStyle(specimenStyle.value)}" data-v-00fae7a8>${ssrInterpolate(HERO_SPECIMEN)}</div>`);
          if (axes.value.length > 0 || features.value.length > 0) {
            _push(`<div class="fp-specimen-body" data-v-00fae7a8><div class="fp-controls-row" data-v-00fae7a8><!--[-->`);
            ssrRenderList(axes.value, (axis) => {
              _push(`<div class="fp-axis" data-v-00fae7a8><label class="fp-axis-label" data-v-00fae7a8><span class="fp-axis-name" data-v-00fae7a8>${ssrInterpolate(axis.name || axis.tag)}</span><span class="fp-axis-value" data-v-00fae7a8>${ssrInterpolate(Math.round(unref(state2).axes[axis.tag] ?? axis.default))}</span></label><input type="range"${ssrRenderAttr("min", axis.min)}${ssrRenderAttr("max", axis.max)}${ssrRenderAttr("value", unref(state2).axes[axis.tag] ?? axis.default)}${ssrRenderAttr("step", axis.tag === "wdth" ? 0.1 : 1)} class="fp-slider" data-v-00fae7a8><div class="fp-axis-range" data-v-00fae7a8><span data-v-00fae7a8>${ssrInterpolate(axis.min)}</span><span data-v-00fae7a8>${ssrInterpolate(axis.max)}</span></div></div>`);
            });
            _push(`<!--]--></div>`);
            if (features.value.length > 0) {
              _push(`<div class="fp-feature-toggles" data-v-00fae7a8><span class="fp-toggles-label" data-v-00fae7a8>Features</span><div class="fp-chips" data-v-00fae7a8><!--[-->`);
              ssrRenderList(features.value, (f) => {
                _push(`<button class="${ssrRenderClass(["fp-chip", { on: unref(state2).features[f.tag] === "on" }])}" data-v-00fae7a8><span class="fp-chip-tag" data-v-00fae7a8>${ssrInterpolate(f.tag)}</span><span class="fp-chip-name" data-v-00fae7a8>${ssrInterpolate(unref(featureInfo)(f.tag).name)}</span></button>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="fp-specimen-samples" data-v-00fae7a8><p class="fp-sample" style="${ssrRenderStyle(specimenStyle.value)}"${ssrRenderAttr("contenteditable", true)} data-v-00fae7a8>${ssrInterpolate(LIGATURE_SPECIMEN)}</p><p class="fp-sample fp-sample--nums" style="${ssrRenderStyle(specimenStyle.value)}"${ssrRenderAttr("contenteditable", true)} data-v-00fae7a8>${ssrInterpolate(NUMBER_SPECIMEN)}</p><p class="fp-sample fp-sample--body" style="${ssrRenderStyle(specimenStyle.value)}"${ssrRenderAttr("contenteditable", true)} data-v-00fae7a8>${ssrInterpolate(BODY_SPECIMEN)}</p></div><p class="fp-hint" data-v-00fae7a8>Click any specimen text to edit. Drag sliders, toggle features — everything updates live.</p></section>`);
        } else if (!loading.value) {
          _push(`<div class="fp-unavailable" data-v-00fae7a8><p class="fp-unavailable-text" data-v-00fae7a8>Specimen unavailable — this font&#39;s license does not permit web preview.</p>`);
          _push(ssrRenderComponent(unref(RouterLink), {
            to: `/formula/${slug.value}`,
            class: "fp-nav-link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`View formula details →`);
              } else {
                return [
                  createTextVNode("View formula details →")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (features.value.length > 0) {
          _push(`<section class="fp-catalog" data-v-00fae7a8><div class="fp-section-head" data-v-00fae7a8><h2 class="fp-section-title" data-v-00fae7a8>OpenType Features</h2><span class="fp-section-meta" data-v-00fae7a8>${ssrInterpolate(features.value.length)} supported</span></div><div class="fp-feature-grid" data-v-00fae7a8><!--[-->`);
          ssrRenderList(features.value, (f) => {
            _push(`<div class="fp-feature-card" data-v-00fae7a8><div class="fp-feature-head" data-v-00fae7a8><span class="fp-feature-tag" data-v-00fae7a8>${ssrInterpolate(f.tag)}</span><span class="fp-feature-name" data-v-00fae7a8>${ssrInterpolate(unref(featureInfo)(f.tag).name)}</span></div><p class="fp-feature-example" style="${ssrRenderStyle({ ...specimenStyle.value, fontFeatureSettings: `'${f.tag}'` })}" data-v-00fae7a8>${ssrInterpolate(unref(featureInfo)(f.tag).example)}</p><p class="fp-feature-desc" data-v-00fae7a8>${ssrInterpolate(unref(featureInfo)(f.tag).desc)}</p></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="fp-stats" data-v-00fae7a8><div class="fp-section-head" data-v-00fae7a8><h2 class="fp-section-title" data-v-00fae7a8>Coverage</h2></div><div class="fp-stat-grid" data-v-00fae7a8>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/font/${slug.value}/unicode`,
          class: "fp-stat-card"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="fp-stat-num" data-v-00fae7a8${_scopeId}>${ssrInterpolate(cpCount.value)}</span><span class="fp-stat-label" data-v-00fae7a8${_scopeId}>codepoints</span>`);
            } else {
              return [
                createVNode("span", { class: "fp-stat-num" }, toDisplayString(cpCount.value), 1),
                createVNode("span", { class: "fp-stat-label" }, "codepoints")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/font/${slug.value}/unicode`,
          class: "fp-stat-card"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="fp-stat-num" data-v-00fae7a8${_scopeId}>${ssrInterpolate(blockCount.value)}<span class="fp-stat-total" data-v-00fae7a8${_scopeId}>/346</span></span><span class="fp-stat-label" data-v-00fae7a8${_scopeId}>blocks</span>`);
            } else {
              return [
                createVNode("span", { class: "fp-stat-num" }, [
                  createTextVNode(toDisplayString(blockCount.value), 1),
                  createVNode("span", { class: "fp-stat-total" }, "/346")
                ]),
                createVNode("span", { class: "fp-stat-label" }, "blocks")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/formula/${slug.value}`,
          class: "fp-stat-card"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="fp-stat-num" data-v-00fae7a8${_scopeId}>${ssrInterpolate(formula.value.familyCount)}</span><span class="fp-stat-label" data-v-00fae7a8${_scopeId}>families</span>`);
            } else {
              return [
                createVNode("span", { class: "fp-stat-num" }, toDisplayString(formula.value.familyCount), 1),
                createVNode("span", { class: "fp-stat-label" }, "families")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/formula/${slug.value}`,
          class: "fp-stat-card"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="fp-stat-num" data-v-00fae7a8${_scopeId}>${ssrInterpolate(formula.value.styleCount)}</span><span class="fp-stat-label" data-v-00fae7a8${_scopeId}>styles</span>`);
            } else {
              return [
                createVNode("span", { class: "fp-stat-num" }, toDisplayString(formula.value.styleCount), 1),
                createVNode("span", { class: "fp-stat-label" }, "styles")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></section></div>`);
      } else if (loading.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fp-loading" }, _attrs))} data-v-00fae7a8>Loading…</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fp-loading" }, _attrs))} data-v-00fae7a8><p data-v-00fae7a8>Font not found.</p>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/browse",
          class: "fp-nav-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Browse all fonts →`);
            } else {
              return [
                createTextVNode("Browse all fonts →")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/FontPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FontPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-00fae7a8"]]);
export {
  FontPage as default
};
