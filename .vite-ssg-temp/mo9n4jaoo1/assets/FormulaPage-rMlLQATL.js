import { defineComponent, computed, ref, withAsyncContext, watch, resolveComponent, mergeProps, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass } from "vue/server-renderer";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import { f as findFormula } from "./loader-BaXvckyu.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FormulaPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = computed(() => route.params.slug);
    const formula = ref(null);
    const loading = ref(true);
    const copied = ref(false);
    async function loadData() {
      loading.value = true;
      try {
        formula.value = await findFormula(slug.value);
      } catch (e) {
        console.error("Failed to load formula data:", e);
      } finally {
        loading.value = false;
      }
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch(slug, loadData);
    useHead(() => {
      var _a;
      return {
        title: formula.value ? `${formula.value.name} — Fontist Formula` : "Formula — Fontist",
        meta: [
          { property: "og:title", content: ((_a = formula.value) == null ? void 0 : _a.name) || "Fontist Formula" },
          { property: "og:type", content: "website" },
          {
            name: "description",
            content: formula.value ? `Install ${formula.value.name} with fontist: ${formula.value.formulaName}. ${formula.value.familyCount} families, ${formula.value.styleCount} styles, ${formula.value.licenseName}.` : "Fontist formula details and install command."
          }
        ],
        link: [
          { rel: "canonical", href: `https://www.fontist.org/formula/${slug.value}` }
        ]
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterLink = resolveComponent("RouterLink");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container" }, _attrs))} data-v-3067dcea>`);
      if (loading.value) {
        _push(`<div data-v-3067dcea><p data-v-3067dcea>Loading…</p></div>`);
      } else if (!formula.value) {
        _push(`<div data-v-3067dcea><h1 class="page-title" data-v-3067dcea>Formula not found</h1><p data-v-3067dcea>No formula found for: <code data-v-3067dcea>${ssrInterpolate(slug.value)}</code></p>`);
        _push(ssrRenderComponent(_component_RouterLink, { to: "/browse" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Back to Browse`);
            } else {
              return [
                createTextVNode("← Back to Browse")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><h1 class="page-title" data-v-3067dcea>${ssrInterpolate(formula.value.name)}</h1><div class="formula-info" data-v-3067dcea><dl class="info-grid" data-v-3067dcea><div class="info-row" data-v-3067dcea><dt data-v-3067dcea>Formula Key</dt><dd data-v-3067dcea><code data-v-3067dcea>${ssrInterpolate(formula.value.formulaName)}</code></dd></div><div class="info-row" data-v-3067dcea><dt data-v-3067dcea>Families</dt><dd data-v-3067dcea>${ssrInterpolate(formula.value.familyCount)}</dd></div><div class="info-row" data-v-3067dcea><dt data-v-3067dcea>Styles</dt><dd data-v-3067dcea>${ssrInterpolate(formula.value.styleCount)}</dd></div><div class="info-row" data-v-3067dcea><dt data-v-3067dcea>Source</dt><dd data-v-3067dcea>${ssrInterpolate(formula.value.sourceType)}</dd></div><div class="info-row" data-v-3067dcea><dt data-v-3067dcea>License</dt><dd data-v-3067dcea>${ssrInterpolate(formula.value.licenseName)}</dd></div>`);
        if (formula.value.familyNames.length) {
          _push(`<div class="info-row" data-v-3067dcea><dt data-v-3067dcea>Family Names</dt><dd data-v-3067dcea>${ssrInterpolate(formula.value.familyNames.join(", "))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</dl></div><div class="install-section" data-v-3067dcea><h2 data-v-3067dcea>Install</h2><div class="install-cmd-wrapper" data-v-3067dcea><code class="install-cmd" data-v-3067dcea>fontist install &quot;${ssrInterpolate(formula.value.formulaName)}&quot;</code><button class="${ssrRenderClass([{ copied: copied.value }, "copy-btn"])}" data-v-3067dcea>${ssrInterpolate(copied.value ? "Copied!" : "Copy")}</button></div></div><div class="font-link-section" data-v-3067dcea>`);
        _push(ssrRenderComponent(_component_RouterLink, {
          to: `/font/${slug.value}`,
          class: "view-font-btn"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View Font Specimen → `);
            } else {
              return [
                createTextVNode(" View Font Specimen → ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/FormulaPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FormulaPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3067dcea"]]);
export {
  FormulaPage as default
};
