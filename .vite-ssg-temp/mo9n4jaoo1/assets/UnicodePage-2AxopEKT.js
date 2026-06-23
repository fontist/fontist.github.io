import { defineComponent, ref, computed, withAsyncContext, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import "./constants-CAbDY4oD.js";
import { g as getPlanes, l as loadAllBlocks } from "./loader-D6YbXYhV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UnicodePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const allBlocks = ref([]);
    const planes = computed(() => getPlanes(allBlocks.value));
    allBlocks.value = ([__temp, __restore] = withAsyncContext(() => loadAllBlocks()), __temp = await __temp, __restore(), __temp);
    useHead({
      title: "Unicode Browser — Fontist",
      meta: [
        { name: "description", content: "Explore all Unicode planes, blocks, and codepoints. Browse scripts, categories, and bidirectional classes." },
        { property: "og:title", content: "Unicode Browser — Fontist" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/unicode" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "uc" }, _attrs))} data-v-e2c442a5><header class="uc-header" data-v-e2c442a5><h1 data-v-e2c442a5>Unicode Browser</h1><p data-v-e2c442a5>The complete Unicode standard. All 7 planes, all 346 blocks, every assigned character.</p></header><div class="uc-planes" data-v-e2c442a5><!--[-->`);
      ssrRenderList(planes.value, (plane) => {
        _push(ssrRenderComponent(unref(RouterLink), {
          key: plane.key,
          to: `/unicode/plane/${plane.key}`,
          class: "uc-plane-card"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="uc-plane-short" data-v-e2c442a5${_scopeId}>${ssrInterpolate(plane.shortName)}</span><span class="uc-plane-name" data-v-e2c442a5${_scopeId}>${ssrInterpolate(plane.name)}</span><span class="uc-plane-range" data-v-e2c442a5${_scopeId}>${ssrInterpolate(plane.range)}</span><span class="uc-plane-blocks" data-v-e2c442a5${_scopeId}>${ssrInterpolate(plane.blocks.length)} blocks</span>`);
            } else {
              return [
                createVNode("span", { class: "uc-plane-short" }, toDisplayString(plane.shortName), 1),
                createVNode("span", { class: "uc-plane-name" }, toDisplayString(plane.name), 1),
                createVNode("span", { class: "uc-plane-range" }, toDisplayString(plane.range), 1),
                createVNode("span", { class: "uc-plane-blocks" }, toDisplayString(plane.blocks.length) + " blocks", 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/UnicodePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const UnicodePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e2c442a5"]]);
export {
  UnicodePage as default
};
