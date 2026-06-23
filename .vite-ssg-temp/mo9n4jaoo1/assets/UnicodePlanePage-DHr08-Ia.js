import { defineComponent, computed, ref, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { useRoute, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { P as PLANES, a as blockSlug, h as hexCp } from "./constants-CAbDY4oD.js";
import { l as loadAllBlocks } from "./loader-D6YbXYhV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UnicodePlanePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const planeId = computed(() => route.params.planeId);
    const allBlocks = ref([]);
    const plane = computed(
      () => PLANES.find((p) => p.key === planeId.value || p.shortName.toLowerCase() === planeId.value.toLowerCase())
    );
    const VERSION_YEARS = {
      "1.1": 1993,
      "2.0": 1996,
      "2.1": 1998,
      "3.0": 1999,
      "3.1": 2001,
      "3.2": 2002,
      "4.0": 2003,
      "4.1": 2005,
      "5.0": 2006,
      "5.1": 2008,
      "5.2": 2009,
      "6.0": 2010,
      "6.1": 2012,
      "6.2": 2012,
      "6.3": 2013,
      "7.0": 2014,
      "8.0": 2015,
      "9.0": 2016,
      "10.0": 2017,
      "11.0": 2018,
      "12.0": 2019,
      "12.1": 2019,
      "13.0": 2020,
      "14.0": 2021,
      "15.0": 2022,
      "15.1": 2023,
      "16.0": 2024,
      "17.0": 2025
    };
    function versionYear(v) {
      return VERSION_YEARS[v] ?? null;
    }
    function versionEra(v) {
      const major = parseFloat(v);
      if (major <= 2) return "era-foundation";
      if (major <= 4) return "era-expansion";
      if (major <= 6) return "era-modernization";
      if (major <= 9) return "era-emoji";
      if (major <= 13) return "era-recent";
      return "era-latest";
    }
    function chartUrl(block) {
      const hex = block.start.toString(16).toUpperCase().padStart(4, "0");
      return `https://www.unicode.org/charts/PDF/U${hex}.html`;
    }
    const blocks = computed(
      () => allBlocks.value.filter((b) => {
        var _a;
        return b.plane === ((_a = plane.value) == null ? void 0 : _a.key);
      }).sort((a, b) => a.start - b.start)
    );
    const versionGroups = computed(() => {
      const groups = [];
      for (const b of blocks.value) {
        const v = b.unicodeVersion || "unknown";
        let g = groups.find((g2) => g2.version === v);
        if (!g) {
          g = { version: v, blocks: [] };
          groups.push(g);
        }
        g.blocks.push(b);
      }
      groups.sort((a, b) => parseFloat(a.version) - parseFloat(b.version));
      return groups;
    });
    const totalCodepoints = computed(() => {
      if (!plane.value) return 0;
      return plane.value.end - plane.value.start + 1;
    });
    allBlocks.value = ([__temp, __restore] = withAsyncContext(() => loadAllBlocks()), __temp = await __temp, __restore(), __temp);
    useHead(() => {
      var _a;
      return {
        title: plane.value ? `${plane.value.shortName} — Unicode Plane` : "Unicode Plane — Fontist",
        meta: [
          { property: "og:title", content: ((_a = plane.value) == null ? void 0 : _a.shortName) || "Unicode Plane" },
          { property: "og:type", content: "website" }
        ],
        link: [
          { rel: "canonical", href: `https://www.fontist.org/unicode/plane/${planeId.value}` }
        ]
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (plane.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "plane" }, _attrs))} data-v-095f6c9c><header class="plane-header" data-v-095f6c9c>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/unicode",
          class: "plane-back"
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
        _push(`<div class="plane-title-block" data-v-095f6c9c><span class="plane-short" data-v-095f6c9c>${ssrInterpolate(plane.value.shortName)}</span><h1 class="plane-name" data-v-095f6c9c>${ssrInterpolate(plane.value.name)}</h1></div><div class="plane-meta" data-v-095f6c9c><span class="plane-range" data-v-095f6c9c>${ssrInterpolate(plane.value.range)}</span><span class="plane-sep" data-v-095f6c9c>·</span><span class="plane-cp-count" data-v-095f6c9c>${ssrInterpolate(totalCodepoints.value.toLocaleString())} codepoints</span><span class="plane-sep" data-v-095f6c9c>·</span><span class="plane-block-count" data-v-095f6c9c>${ssrInterpolate(blocks.value.length)} blocks</span></div><a${ssrRenderAttr("href", `https://www.unicode.org/versions/enumeratedversions.html`)} class="plane-ref" target="_blank" rel="noopener" data-v-095f6c9c>Unicode version history ↗</a></header><!--[-->`);
        ssrRenderList(versionGroups.value, (group) => {
          _push(`<section class="version-section" data-v-095f6c9c><div class="${ssrRenderClass([versionEra(group.version), "version-header"])}" data-v-095f6c9c><div class="version-badge" data-v-095f6c9c><span class="version-num" data-v-095f6c9c>${ssrInterpolate(group.version)}</span></div><div class="version-info" data-v-095f6c9c><span class="version-label" data-v-095f6c9c>Unicode ${ssrInterpolate(group.version)}</span>`);
          if (versionYear(group.version)) {
            _push(`<span class="version-year" data-v-095f6c9c>${ssrInterpolate(versionYear(group.version))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><span class="version-block-count" data-v-095f6c9c>${ssrInterpolate(group.blocks.length)} blocks</span></div><div class="block-list" data-v-095f6c9c><!--[-->`);
          ssrRenderList(group.blocks, (block) => {
            _push(`<div class="block-row" data-v-095f6c9c>`);
            _push(ssrRenderComponent(unref(RouterLink), {
              to: `/unicode/block/${unref(blockSlug)(block.name)}`,
              class: "block-info"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<span class="block-code" data-v-095f6c9c${_scopeId}>${ssrInterpolate(unref(hexCp)(block.start))}</span><span class="block-code-dash" data-v-095f6c9c${_scopeId}>–</span><span class="block-code" data-v-095f6c9c${_scopeId}>${ssrInterpolate(unref(hexCp)(block.end))}</span><span class="block-name" data-v-095f6c9c${_scopeId}>${ssrInterpolate(block.displayName || block.name)}</span>`);
                } else {
                  return [
                    createVNode("span", { class: "block-code" }, toDisplayString(unref(hexCp)(block.start)), 1),
                    createVNode("span", { class: "block-code-dash" }, "–"),
                    createVNode("span", { class: "block-code" }, toDisplayString(unref(hexCp)(block.end)), 1),
                    createVNode("span", { class: "block-name" }, toDisplayString(block.displayName || block.name), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`<span class="block-size" data-v-095f6c9c>${ssrInterpolate((block.end - block.start + 1).toLocaleString())} cp</span><a${ssrRenderAttr("href", chartUrl(block))} class="block-chart" target="_blank" rel="noopener" title="Unicode code chart (PDF)" data-v-095f6c9c>chart ↗</a></div>`);
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else if (!_ctx.loading) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "plane-loading" }, _attrs))} data-v-095f6c9c>Plane &quot;${ssrInterpolate(planeId.value)}&quot; not found.</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "plane-loading" }, _attrs))} data-v-095f6c9c>Loading…</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/UnicodePlanePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const UnicodePlanePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-095f6c9c"]]);
export {
  UnicodePlanePage as default
};
