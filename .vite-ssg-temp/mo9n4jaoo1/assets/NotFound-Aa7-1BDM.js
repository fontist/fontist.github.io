import { resolveComponent, mergeProps, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container not-found-page" }, _attrs))} data-v-f37add2e><h1 class="page-title" data-v-f37add2e>404 — Page Not Found</h1><p data-v-f37add2e>The page you&#39;re looking for doesn&#39;t exist.</p><div class="actions" data-v-f37add2e>`);
  _push(ssrRenderComponent(_component_RouterLink, {
    to: "/",
    class: "home-link"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`← Back to Home`);
      } else {
        return [
          createTextVNode("← Back to Home")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_RouterLink, {
    to: "/browse",
    class: "browse-link"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Browse Fonts →`);
      } else {
        return [
          createTextVNode("Browse Fonts →")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/NotFound.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const NotFound = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-f37add2e"]]);
export {
  NotFound as default
};
