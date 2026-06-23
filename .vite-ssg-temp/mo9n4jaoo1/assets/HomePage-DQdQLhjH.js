import { defineComponent, ref, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from "vue/server-renderer";
import { RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { l as loadAllFormulas } from "./loader-BaXvckyu.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "HomePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const formulaCount = ref(0);
    try {
      const data = ([__temp, __restore] = withAsyncContext(() => loadAllFormulas()), __temp = await __temp, __restore(), __temp);
      formulaCount.value = data.length;
    } catch {
    }
    useHead({
      title: "Fontist — Install fonts anywhere",
      meta: [
        { name: "description", content: "Install, manage, and explore openly-licensed fonts across Windows, Linux, and macOS. Open-source font manager for developers." },
        { property: "og:title", content: "Fontist — Install fonts anywhere" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://www.fontist.org/" },
        { name: "twitter:card", content: "summary_large_image" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "home" }, _attrs))} data-v-2eb5808c><section class="hero" data-v-2eb5808c><h1 class="hero-title" data-v-2eb5808c>Fontist</h1><p class="hero-subtitle" data-v-2eb5808c> Install, manage, and explore ${ssrInterpolate(formulaCount.value > 0 ? formulaCount.value.toLocaleString() : "4,280+")} openly-licensed fonts across Windows, Linux, and macOS. </p><div class="hero-cta" data-v-2eb5808c>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/browse",
        class: "cta-primary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Browse fonts →`);
          } else {
            return [
              createTextVNode("Browse fonts →")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/unicode",
        class: "cta-secondary"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Unicode browser`);
          } else {
            return [
              createTextVNode("Unicode browser")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></section><section class="features" data-v-2eb5808c>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/browse",
        class: "feature-card"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h3 data-v-2eb5808c${_scopeId}>Browse Formulas</h3><p data-v-2eb5808c${_scopeId}>Search ${ssrInterpolate(formulaCount.value > 0 ? formulaCount.value.toLocaleString() : "4,280+")} font formulas by name, license, or platform.</p>`);
          } else {
            return [
              createVNode("h3", null, "Browse Formulas"),
              createVNode("p", null, "Search " + toDisplayString(formulaCount.value > 0 ? formulaCount.value.toLocaleString() : "4,280+") + " font formulas by name, license, or platform.", 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/unicode",
        class: "feature-card"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h3 data-v-2eb5808c${_scopeId}>Unicode Browser</h3><p data-v-2eb5808c${_scopeId}>Explore Unicode 16.0 — planes, blocks, characters, scripts, and categories.</p>`);
          } else {
            return [
              createVNode("h3", null, "Unicode Browser"),
              createVNode("p", null, "Explore Unicode 16.0 — planes, blocks, characters, scripts, and categories.")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/guide",
        class: "feature-card"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h3 data-v-2eb5808c${_scopeId}>Guide</h3><p data-v-2eb5808c${_scopeId}>Learn about fonts, formulas, and how to use Fontist in your projects.</p>`);
          } else {
            return [
              createVNode("h3", null, "Guide"),
              createVNode("p", null, "Learn about fonts, formulas, and how to use Fontist in your projects.")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/licenses",
        class: "feature-card"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h3 data-v-2eb5808c${_scopeId}>Licenses</h3><p data-v-2eb5808c${_scopeId}>Understand font licenses — OFL, Apache, MIT, and what they permit.</p>`);
          } else {
            return [
              createVNode("h3", null, "Licenses"),
              createVNode("p", null, "Understand font licenses — OFL, Apache, MIT, and what they permit.")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</section><section class="tools" data-v-2eb5808c><div class="tool" data-v-2eb5808c><h3 data-v-2eb5808c>Fontist CLI</h3><p data-v-2eb5808c>Cross-platform font installer. <code data-v-2eb5808c>gem install fontist</code></p><a href="https://github.com/fontist/fontist" data-v-2eb5808c>GitHub →</a></div><div class="tool" data-v-2eb5808c><h3 data-v-2eb5808c>Fontisan</h3><p data-v-2eb5808c>Font processing library for Ruby. Subset, convert, analyze.</p><a href="https://github.com/fontist/fontisan" data-v-2eb5808c>GitHub →</a></div><div class="tool" data-v-2eb5808c><h3 data-v-2eb5808c>Formulas</h3><p data-v-2eb5808c>${ssrInterpolate(formulaCount.value > 0 ? formulaCount.value.toLocaleString() : "4,280+")} font formula files. The data behind it all.</p><a href="https://github.com/fontist/formulas" data-v-2eb5808c>GitHub →</a></div></section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/HomePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const HomePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2eb5808c"]]);
export {
  HomePage as default
};
