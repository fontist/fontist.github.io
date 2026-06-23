import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { i as injectFontFace, f as fetchCoverage } from "./useCoverage-BKNfcfvg.js";
import { b as blockDisplayName, h as hexCp } from "./constants-CAbDY4oD.js";
import { l as loadAllBlocks, a as loadBlockCharacters } from "./loader-D6YbXYhV.js";
import { U as UnicodeBlockGrid } from "./UnicodeBlockGrid-SKtCUWXV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "FontBlockPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const router = useRouter();
    const slug = computed(() => route.params.slug);
    const blockParam = computed(() => route.params.block);
    const block = ref(null);
    const coverage = ref(null);
    const fontReady = ref(false);
    ref(null);
    const fontId = ref("");
    const fontCtx = computed(() => {
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
    const supportedCount = computed(() => {
      if (!block.value || !coverage.value) return 0;
      const cps = new Set(coverage.value.codepoints || []);
      return block.value.characters.filter((c) => cps.has(c.cp)).length;
    });
    const missingCount = computed(() => {
      if (!block.value) return 0;
      return block.value.characters.length - supportedCount.value;
    });
    async function loadData() {
      const s = slug.value;
      if (!s) return;
      const { fontId: fid, ensureInjected } = injectFontFace(s, `fonts/${s}.woff`);
      fontId.value = fid;
      fontReady.value = ensureInjected();
      coverage.value = await fetchCoverage(s);
      const allBlocks = await loadAllBlocks();
      const found = allBlocks.find((b) => {
        const sl = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return sl === blockParam.value;
      });
      if (found) {
        const chars = await loadBlockCharacters(found.name);
        block.value = { ...found, characters: chars, assignedCount: chars.length };
      }
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch([slug, blockParam], loadData);
    useHead(() => ({
      title: block.value ? `${slug.value} / ${blockDisplayName(block.value.name)} — Coverage` : `${slug.value} — Coverage`,
      link: [
        { rel: "canonical", href: `https://www.fontist.org/font/${slug.value}/unicode/${blockParam.value}` }
      ]
    }));
    function goToChar(cp) {
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      router.push(`/unicode/char/${hex}`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (block.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fbp" }, _attrs))} data-v-2a8c9715><header class="fbp-head" data-v-2a8c9715>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/font/${slug.value}/unicode`,
          class: "fbp-back"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← All blocks`);
            } else {
              return [
                createTextVNode("← All blocks")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 data-v-2a8c9715>${ssrInterpolate(unref(blockDisplayName)(block.value.name))}</h1><span class="fbp-meta" data-v-2a8c9715>${ssrInterpolate(unref(hexCp)(block.value.start))}–${ssrInterpolate(unref(hexCp)(block.value.end))} · <strong data-v-2a8c9715>${ssrInterpolate(supportedCount.value)}</strong>/${ssrInterpolate(block.value.characters.length)} supported · <strong data-v-2a8c9715>${ssrInterpolate(missingCount.value)}</strong> missing </span></header>`);
        _push(ssrRenderComponent(UnicodeBlockGrid, {
          block: block.value,
          fonts: fontCtx.value ? [fontCtx.value] : [],
          mode: "per-font",
          "show-missing": true,
          onSelect: goToChar
        }, null, _parent));
        _push(`</div>`);
      } else if (_ctx.loading) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fbp-loading" }, _attrs))} data-v-2a8c9715>Loading…</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fbp-loading" }, _attrs))} data-v-2a8c9715>Block not found.</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/FontBlockPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const FontBlockPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2a8c9715"]]);
export {
  FontBlockPage as default
};
