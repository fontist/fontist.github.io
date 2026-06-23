import { defineComponent, ref, computed, withAsyncContext, watch, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
import { useRoute } from "vue-router";
import { marked } from "marked";
import { useHead } from "@unhead/vue";
import { u as useMarkdownLinks } from "./useMarkdownLinks-CrWrxXGe.js";
import { l as loadMarkdown } from "./loader-476v0O_d.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlogPostPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const html = ref("");
    const loading = ref(true);
    const title = ref("");
    const contentRef = ref(null);
    useMarkdownLinks(contentRef);
    const slug = computed(() => route.params.slug);
    async function loadPost(s) {
      loading.value = true;
      const md = await loadMarkdown(`content/blog/${s}.md`);
      if (md) {
        html.value = await marked(md);
        const m = md.match(/^#\s+(.+)$/m);
        title.value = m ? m[1].trim() : s.replace(/-/g, " ");
      } else {
        html.value = "<p>Post not found.</p>";
        title.value = "Post not found";
      }
      loading.value = false;
    }
    [__temp, __restore] = withAsyncContext(() => loadPost(slug.value)), await __temp, __restore();
    watch(slug, (s) => {
      if (s) loadPost(s);
    });
    useHead(() => ({
      title: title.value ? `${title.value} — Fontist Blog` : "Fontist Blog",
      meta: [
        { property: "og:title", content: title.value || "Fontist Blog" },
        { property: "og:type", content: "article" }
      ],
      link: [
        { rel: "canonical", href: `https://www.fontist.org/blog/${slug.value}` }
      ]
    }));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container" }, _attrs))} data-v-32f1d581>`);
      if (!loading.value) {
        _push(`<article class="markdown-content" data-v-32f1d581>${html.value ?? ""}</article>`);
      } else {
        _push(`<div class="loading" data-v-32f1d581>Loading…</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/BlogPostPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const BlogPostPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-32f1d581"]]);
export {
  BlogPostPage as default
};
