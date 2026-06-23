import { defineComponent, ref, computed, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { useRoute, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { marked } from "marked";
import { a as fetchText } from "./ssr-fetch-DJg5wTjq.js";
import { u as useMarkdownLinks } from "./useMarkdownLinks-CrWrxXGe.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "LicensePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const html = ref("");
    const notFound = ref(false);
    const contentRef = ref(null);
    useMarkdownLinks(contentRef);
    const licensePath = computed(() => {
      const params = route.params.path;
      if (Array.isArray(params) && params.length > 0) return params.join("/");
      return "";
    });
    const candidates = computed(() => {
      const path = licensePath.value || "";
      const fileBase = path || "index";
      return [
        `content/licenses/${fileBase}.md`,
        `content/licenses/${path ? path + "/" : ""}index.md`,
        `content/licenses/index.md`
      ];
    });
    async function loadLicense() {
      html.value = "";
      notFound.value = false;
      for (const p of candidates.value) {
        try {
          const md = await fetchText(p);
          if (md) {
            html.value = await marked(md);
            return;
          }
        } catch {
        }
      }
      notFound.value = true;
    }
    [__temp, __restore] = withAsyncContext(() => loadLicense()), await __temp, __restore();
    watch(licensePath, loadLicense);
    useHead(() => ({
      title: notFound.value ? "License — Not Found" : `${(licensePath.value || "Licenses").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — Fontist License`,
      link: [
        { rel: "canonical", href: `https://www.fontist.org/licenses/${licensePath.value}` }
      ]
    }));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container license-page" }, _attrs))} data-v-0eb8787b>`);
      if (notFound.value) {
        _push(`<div class="lp-notfound" data-v-0eb8787b><h1 data-v-0eb8787b>License page not found</h1>`);
        _push(ssrRenderComponent(unref(RouterLink), { to: "/licenses" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Back to Licenses`);
            } else {
              return [
                createTextVNode("← Back to Licenses")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<article class="lp-content" data-v-0eb8787b>${html.value ?? ""}</article>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/LicensePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const LicensePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-0eb8787b"]]);
export {
  LicensePage as default
};
