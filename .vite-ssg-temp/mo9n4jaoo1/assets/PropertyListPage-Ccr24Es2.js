import { defineComponent, ref, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
import { RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PropertyListPage",
  __ssrInlineRender: true,
  props: {
    property: {},
    title: {},
    label: {}
  },
  async setup(__props) {
    let __temp, __restore;
    const props = __props;
    const entries = ref([]);
    const indexUrl = computed(() => `unicode/indexes/by-${props.property === "scripts" ? "script" : props.property === "category" ? "category" : props.property === "combining" ? "combining" : "bidi"}.json`);
    const detailPrefix = computed(() => `/unicode/${props.property}`);
    try {
      const data = ([__temp, __restore] = withAsyncContext(() => fetchJson(indexUrl.value)), __temp = await __temp, __restore(), __temp);
      entries.value = Object.entries(data).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    } catch (e) {
      console.error(e);
    }
    useHead({
      title: `${props.title} — Unicode ${props.property}`,
      link: [
        { rel: "canonical", href: `https://www.fontist.org/unicode/${props.property}` }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "plp" }, _attrs))} data-v-79c7f849><header class="plp-head" data-v-79c7f849>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/unicode",
        class: "plp-back"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`← Unicode`);
          } else {
            return [
              createTextVNode("← Unicode")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 data-v-79c7f849>${ssrInterpolate(__props.title)}</h1><span class="plp-count" data-v-79c7f849>${ssrInterpolate(entries.value.length)} ${ssrInterpolate(__props.label)}</span></header><div class="plp-grid" data-v-79c7f849><!--[-->`);
      ssrRenderList(entries.value, (entry) => {
        _push(ssrRenderComponent(unref(RouterLink), {
          key: entry.value,
          to: `${detailPrefix.value}/${entry.value}`,
          class: "plp-item"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="plp-value" data-v-79c7f849${_scopeId}>${ssrInterpolate(entry.value)}</span><span class="plp-count-num" data-v-79c7f849${_scopeId}>${ssrInterpolate(entry.count.toLocaleString())}</span>`);
            } else {
              return [
                createVNode("span", { class: "plp-value" }, toDisplayString(entry.value), 1),
                createVNode("span", { class: "plp-count-num" }, toDisplayString(entry.count.toLocaleString()), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/PropertyListPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PropertyListPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-79c7f849"]]);
export {
  PropertyListPage as default
};
