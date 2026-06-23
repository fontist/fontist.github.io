import { defineComponent, ref, withAsyncContext, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
import { marked } from "marked";
import { useHead } from "@unhead/vue";
import { u as useMarkdownLinks } from "./useMarkdownLinks-CrWrxXGe.js";
import { l as loadMarkdown } from "./loader-476v0O_d.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "vue-router";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AboutPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const html = ref("");
    const loading = ref(true);
    const contentRef = ref(null);
    useMarkdownLinks(contentRef);
    const md = ([__temp, __restore] = withAsyncContext(() => loadMarkdown("content/about.md")), __temp = await __temp, __restore(), __temp);
    if (md) html.value = ([__temp, __restore] = withAsyncContext(() => marked(md)), __temp = await __temp, __restore(), __temp);
    loading.value = false;
    useHead({
      title: "About — Fontist",
      meta: [
        { name: "description", content: "About Fontist: an open-source font manager for installing, managing, and exploring openly-licensed fonts." },
        { property: "og:title", content: "About — Fontist" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/about" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container" }, _attrs))} data-v-a6bdcf54>`);
      if (!loading.value) {
        _push(`<article class="markdown-content" data-v-a6bdcf54>${html.value ?? ""}</article>`);
      } else {
        _push(`<div class="loading" data-v-a6bdcf54>Loading…</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/AboutPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AboutPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a6bdcf54"]]);
export {
  AboutPage as default
};
