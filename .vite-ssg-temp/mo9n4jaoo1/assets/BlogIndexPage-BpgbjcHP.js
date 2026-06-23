import { defineComponent, ref, withAsyncContext, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BlogIndexPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const posts = ref([]);
    try {
      posts.value = ([__temp, __restore] = withAsyncContext(() => fetchJson("content/blog/index.json")), __temp = await __temp, __restore(), __temp);
    } catch {
      posts.value = [
        { slug: "2022-02-11-introducing-fontist", title: "Introducing Fontist", date: "2022-02-11" },
        { slug: "2022-02-11-macos-fonts", title: "macOS Fonts", date: "2022-02-11" },
        { slug: "2024-01-23-office-fonts", title: "Office Fonts", date: "2024-01-23" },
        { slug: "2024-02-29-new-websites", title: "New Websites", date: "2024-02-29" },
        { slug: "2024-03-02-creating-formulas", title: "Creating Formulas", date: "2024-03-02" },
        { slug: "2026-03-12-unified-design", title: "Unified Design and Logo", date: "2026-03-12" },
        { slug: "2026-04-14-formula-v5", title: "Formula v5", date: "2026-04-14" },
        { slug: "2026-05-03-windows-fod-fonts", title: "Windows FOD Fonts", date: "2026-05-03" }
      ];
    }
    useHead({
      title: "Blog — Fontist",
      meta: [
        { name: "description", content: "News and updates from the Fontist project — releases, new features, and font discoveries." },
        { property: "og:title", content: "Blog — Fontist" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/blog" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "blog-index" }, _attrs))} data-v-b85da3e6><header class="blog-head" data-v-b85da3e6><h1 data-v-b85da3e6>Blog</h1><p data-v-b85da3e6>News and updates from the Fontist project.</p></header><ul class="post-list" data-v-b85da3e6><!--[-->`);
      ssrRenderList(posts.value, (post) => {
        _push(`<li class="post-item" data-v-b85da3e6>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/blog/${post.slug}`,
          class: "post-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="post-title" data-v-b85da3e6${_scopeId}>${ssrInterpolate(post.title)}</span><span class="post-date" data-v-b85da3e6${_scopeId}>${ssrInterpolate(post.date)}</span>`);
            } else {
              return [
                createVNode("span", { class: "post-title" }, toDisplayString(post.title), 1),
                createVNode("span", { class: "post-date" }, toDisplayString(post.date), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/BlogIndexPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const BlogIndexPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b85da3e6"]]);
export {
  BlogIndexPage as default
};
