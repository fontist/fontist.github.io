import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { i as injectFontFace, f as fetchCoverage } from "./useCoverage-BKNfcfvg.js";
import { b as blockDisplayName, h as hexCp } from "./constants-CAbDY4oD.js";
import { g as getPlanes, l as loadAllBlocks } from "./loader-D6YbXYhV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FontUnicodePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useRouter();
    const slug = computed(() => route.params.slug);
    const allBlocks = ref([]);
    const coverage = ref(null);
    const fontReady = ref(false);
    const fontId = ref("");
    computed(() => {
      if (!coverage.value) return null;
      return {
        slug: slug.value,
        familyName: slug.value,
        fontId: fontId.value,
        fontPath: `fonts/${slug.value}.woff`,
        redistributable: true,
        coverage: new Set(coverage.value.codepoints || []),
        color: "#bf4e6a"
      };
    });
    const planes = computed(() => allBlocks.value.length ? getPlanes(allBlocks.value) : []);
    async function loadData() {
      const s = slug.value;
      if (!s) return;
      const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff`);
      fontId.value = fid;
      fontReady.value = ensureInjected();
      coverage.value = await fetchCoverage(s);
      allBlocks.value = await loadAllBlocks();
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch(slug, loadData);
    useHead(() => ({
      title: `${slug.value.replace(/\b\w/g, (c) => c.toUpperCase())} — Unicode Coverage`,
      meta: [
        { property: "og:title", content: `${slug.value} Unicode Coverage` },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: `https://www.fontist.org/font/${slug.value}/unicode` }
      ]
    }));
    function blockSupportCount(block) {
      var _a, _b;
      if (!((_a = coverage.value) == null ? void 0 : _a.blocks)) return 0;
      const cov = coverage.value.blocks.find((b) => b.name === block.name);
      return ((_b = cov == null ? void 0 : cov.codepoints) == null ? void 0 : _b.length) || 0;
    }
    function blockStatus(block) {
      const count = blockSupportCount(block);
      const total = block.end - block.start + 1;
      if (count === 0) return "none";
      if (count >= total * 0.99) return "full";
      return "partial";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fup" }, _attrs))} data-v-dac60e8e><header class="fup-head" data-v-dac60e8e>`);
      _push(ssrRenderComponent(unref(RouterLink), {
        to: `/font/${slug.value}`,
        class: "fup-back"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`← ${ssrInterpolate(slug.value)}`);
          } else {
            return [
              createTextVNode("← " + toDisplayString(slug.value), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 data-v-dac60e8e>Unicode Coverage</h1>`);
      if (coverage.value) {
        _push(`<span class="fup-summary" data-v-dac60e8e>${ssrInterpolate(coverage.value.total_codepoints)} codepoints · ${ssrInterpolate(coverage.value.supported_blocks)}/${ssrInterpolate(coverage.value.total_blocks)} blocks </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header><div class="fup-planes" data-v-dac60e8e><!--[-->`);
      ssrRenderList(planes.value, (plane) => {
        _push(`<section class="fup-plane" data-v-dac60e8e><h2 class="fup-plane-name" data-v-dac60e8e>${ssrInterpolate(plane.shortName)} — ${ssrInterpolate(plane.name)} <span class="fup-plane-range" data-v-dac60e8e>${ssrInterpolate(plane.range)}</span></h2><div class="fup-blocks" data-v-dac60e8e><!--[-->`);
        ssrRenderList(plane.blocks, (block) => {
          _push(`<div class="${ssrRenderClass(["fup-block", blockStatus(block)])}" data-v-dac60e8e><div class="fup-block-info" data-v-dac60e8e><span class="fup-block-name" data-v-dac60e8e>${ssrInterpolate(unref(blockDisplayName)(block.name))}</span><span class="fup-block-range" data-v-dac60e8e>${ssrInterpolate(unref(hexCp)(block.start))}–${ssrInterpolate(unref(hexCp)(block.end))}</span></div><div class="fup-block-cov" data-v-dac60e8e><span class="fup-block-count" data-v-dac60e8e>${ssrInterpolate(blockSupportCount(block))}</span><span class="fup-block-total" data-v-dac60e8e>/ ${ssrInterpolate(block.end - block.start + 1)}</span></div><div class="fup-block-bar" data-v-dac60e8e><div class="fup-block-fill" style="${ssrRenderStyle({
            width: blockSupportCount(block) / (block.end - block.start + 1) * 100 + "%"
          })}" data-v-dac60e8e></div></div></div>`);
        });
        _push(`<!--]--></div></section>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/FontUnicodePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FontUnicodePage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-dac60e8e"]]);
export {
  FontUnicodePage as default
};
