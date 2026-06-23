import { ViteSSG } from "vite-ssg";
import { defineComponent, mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext, resolveDynamicComponent, openBlock, createBlock, Suspense } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderSlot, ssrRenderSuspense, ssrRenderVNode } from "vue/server-renderer";
import { RouterLink, RouterView } from "vue-router";
const routes = [
  { path: "/", name: "home", component: () => import("./assets/HomePage-DQdQLhjH.js") },
  { path: "/about", name: "about", component: () => import("./assets/AboutPage-DQwe3s0f.js") },
  { path: "/blog", name: "blog", component: () => import("./assets/BlogIndexPage-BpgbjcHP.js") },
  { path: "/blog/:slug", name: "blog-post", component: () => import("./assets/BlogPostPage-B7kMU1go.js") },
  { path: "/font/:slug(.+)/unicode/:block", name: "font-block", component: () => import("./assets/FontBlockPage-DPkj03ws.js") },
  { path: "/font/:slug(.+)/unicode", name: "font-unicode", component: () => import("./assets/FontUnicodePage-DReSiEZg.js") },
  { path: "/font/:slug(.+)", name: "font", component: () => import("./assets/FontPage-8A4Ecx9x.js") },
  { path: "/formula/:slug(.+)", name: "formula", component: () => import("./assets/FormulaPage-rMlLQATL.js") },
  { path: "/browse", name: "browse", component: () => import("./assets/BrowsePage-DQfcV25S.js") },
  { path: "/compare", name: "compare", component: () => import("./assets/ComparePage-BR5aZA6G.js") },
  { path: "/compare/:fonts", name: "compare-fonts", component: () => import("./assets/ComparePage-BR5aZA6G.js") },
  { path: "/unicode", name: "unicode", component: () => import("./assets/UnicodePage-2AxopEKT.js") },
  { path: "/unicode/plane/:planeId", name: "unicode-plane", component: () => import("./assets/UnicodePlanePage-DHr08-Ia.js") },
  { path: "/unicode/block/:blockSlug", name: "unicode-block", component: () => import("./assets/UnicodeBlockPage-BNOlFLX5.js") },
  { path: "/unicode/char/:hex", name: "unicode-char", component: () => import("./assets/UnicodeCharPage-DbYioBDk.js") },
  { path: "/unicode/scripts", name: "unicode-scripts", component: () => import("./assets/PropertyListPage-Ccr24Es2.js"), props: { property: "scripts", title: "Scripts", label: "scripts" } },
  { path: "/unicode/scripts/:code", name: "unicode-script", component: () => import("./assets/PropertyDetailPage-mPEbMfSL.js"), props: { property: "scripts", title: "Script" } },
  { path: "/unicode/category", name: "unicode-categories", component: () => import("./assets/PropertyListPage-Ccr24Es2.js"), props: { property: "category", title: "Character Categories", label: "categories" } },
  { path: "/unicode/category/:code", name: "unicode-category", component: () => import("./assets/PropertyDetailPage-mPEbMfSL.js"), props: { property: "category", title: "Category" } },
  { path: "/unicode/combining", name: "unicode-combining", component: () => import("./assets/PropertyListPage-Ccr24Es2.js"), props: { property: "combining", title: "Combining Classes", label: "classes" } },
  { path: "/unicode/combining/:cc", name: "unicode-combining-class", component: () => import("./assets/PropertyDetailPage-mPEbMfSL.js"), props: { property: "combining", title: "Combining Class" } },
  { path: "/unicode/bidiclass", name: "unicode-bidiclasses", component: () => import("./assets/PropertyListPage-Ccr24Es2.js"), props: { property: "bidiclass", title: "Bidirectional Classes", label: "classes" } },
  { path: "/unicode/bidiclass/:bc", name: "unicode-bidiclass", component: () => import("./assets/PropertyDetailPage-mPEbMfSL.js"), props: { property: "bidiclass", title: "Bidirectional Class" } },
  { path: "/guide/:path(.*)*", name: "guide", component: () => import("./assets/GuidePage-D4_RAgH3.js") },
  { path: "/licenses/:path(.*)*", name: "licenses", component: () => import("./assets/LicensePage-CVc4FODT.js") },
  { path: "/:path(.*)*", name: "not-found", component: () => import("./assets/NotFound-Aa7-1BDM.js") }
];
const _imports_0 = "/favicon.svg";
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DefaultLayout",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "layout" }, _attrs))}><nav class="nav"><div class="nav-inner">`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/",
        class: "nav-logo"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Fontist" class="nav-logo-img"${_scopeId}> Fontist `);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Fontist",
                class: "nav-logo-img"
              }),
              createTextVNode(" Fontist ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="nav-links">`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/browse",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Browse`);
          } else {
            return [
              createTextVNode("Browse")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/unicode",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Unicode`);
          } else {
            return [
              createTextVNode("Unicode")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/guide",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Guide`);
          } else {
            return [
              createTextVNode("Guide")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/blog",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Blog`);
          } else {
            return [
              createTextVNode("Blog")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(unref(RouterLink), {
        to: "/about",
        class: "nav-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`About`);
          } else {
            return [
              createTextVNode("About")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<a href="https://github.com/fontist/fontist" class="nav-link">GitHub</a></div></div></nav><main class="main">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main><footer class="footer"><div class="footer-inner"><a href="https://github.com/fontist">GitHub</a><span>·</span>`);
      _push(ssrRenderComponent(unref(RouterLink), { to: "/about" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`About`);
          } else {
            return [
              createTextVNode("About")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span>·</span><a href="https://www.rubydoc.info/gems/fontist">RubyDocs</a></div></footer></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/layouts/DefaultLayout.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "App",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(_sfc_main$1, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(RouterView), null, {
              default: withCtx(({ Component }, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  ssrRenderSuspense(_push3, {
                    fallback: () => {
                      _push3(`<div class="page-loading"${_scopeId2}>Loading…</div>`);
                    },
                    default: () => {
                      ssrRenderVNode(_push3, createVNode(resolveDynamicComponent(Component), null, null), _parent3, _scopeId2);
                    },
                    _: 2
                  });
                } else {
                  return [
                    (openBlock(), createBlock(Suspense, null, {
                      fallback: withCtx(() => [
                        createVNode("div", { class: "page-loading" }, "Loading…")
                      ]),
                      default: withCtx(() => [
                        (openBlock(), createBlock(resolveDynamicComponent(Component)))
                      ]),
                      _: 2
                    }, 1024))
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(unref(RouterView), null, {
                default: withCtx(({ Component }) => [
                  (openBlock(), createBlock(Suspense, null, {
                    fallback: withCtx(() => [
                      createVNode("div", { class: "page-loading" }, "Loading…")
                    ]),
                    default: withCtx(() => [
                      (openBlock(), createBlock(resolveDynamicComponent(Component)))
                    ]),
                    _: 2
                  }, 1024))
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/App.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const createApp = ViteSSG(
  _sfc_main,
  { routes, base: "/" },
  () => {
  }
);
export {
  createApp
};
