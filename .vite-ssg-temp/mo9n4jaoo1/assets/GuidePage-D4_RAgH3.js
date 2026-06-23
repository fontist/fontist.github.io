import { defineComponent, ref, computed, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { useRoute, RouterLink } from "vue-router";
import { marked } from "marked";
import { useHead } from "@unhead/vue";
import { u as useMarkdownLinks } from "./useMarkdownLinks-CrWrxXGe.js";
import { l as loadMarkdown } from "./loader-476v0O_d.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GuidePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const html = ref("");
    const loading = ref(true);
    const notFound = ref(false);
    const title = ref("Guide");
    const contentRef = ref(null);
    useMarkdownLinks(contentRef);
    const guidePath = computed(() => {
      const params = route.params.path;
      if (Array.isArray(params) && params.length > 0) return params.join("/");
      return "";
    });
    async function loadGuide() {
      loading.value = true;
      notFound.value = false;
      html.value = "";
      const path = guidePath.value || "";
      const segments = path ? path.split("/") : [];
      const fileBase = segments.length > 0 ? segments[segments.length - 1] : "index";
      const dir = segments.length > 1 ? segments.slice(0, -1).join("/") + "/" : "";
      const candidates = [
        `content/guide/${dir}${fileBase}.md`,
        `content/guide/${path ? path + "/" : ""}index.md`,
        `content/guide/index.md`
      ];
      for (const c of candidates) {
        const md = await loadMarkdown(c);
        if (md) {
          html.value = await marked(md);
          const m = md.match(/^#\s+(.+)$/m);
          title.value = m ? m[1].trim() : "Fontist Guide";
          break;
        }
      }
      if (!html.value) notFound.value = true;
      loading.value = false;
    }
    [__temp, __restore] = withAsyncContext(() => loadGuide()), await __temp, __restore();
    watch(guidePath, loadGuide);
    useHead(() => ({
      title: `${title.value} — Fontist`,
      link: [
        { rel: "canonical", href: `https://www.fontist.org/guide/${guidePath.value}` }
      ]
    }));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container guide-page" }, _attrs))} data-v-6bdb3b7d>`);
      if (loading.value) {
        _push(`<div class="gp-loading" data-v-6bdb3b7d><p data-v-6bdb3b7d>Loading…</p></div>`);
      } else if (notFound.value) {
        _push(`<div class="gp-notfound" data-v-6bdb3b7d><h1 data-v-6bdb3b7d>Guide page not found</h1>`);
        _push(ssrRenderComponent(unref(RouterLink), { to: "/guide" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Back to Guide`);
            } else {
              return [
                createTextVNode("← Back to Guide")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<article class="gp-content" data-v-6bdb3b7d>${html.value ?? ""}</article>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/GuidePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const GuidePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6bdb3b7d"]]);
export {
  GuidePage as default
};
