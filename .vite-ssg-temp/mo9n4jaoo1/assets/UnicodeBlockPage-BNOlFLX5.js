import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { b as blockDisplayName, h as hexCp, s as scriptGroup } from "./constants-CAbDY4oD.js";
import { l as loadAllBlocks, a as loadBlockCharacters } from "./loader-D6YbXYhV.js";
import { U as UnicodeBlockGrid } from "./UnicodeBlockGrid-SKtCUWXV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UnicodeBlockPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const router = useRouter();
    const blockSlugParam = computed(() => route.params.blockSlug);
    const block = ref(null);
    const characters = ref([]);
    const blockWithChars = computed(
      () => block.value ? { ...block.value, characters: characters.value, assignedCount: characters.value.length } : null
    );
    const isPrivateUse = computed(
      () => {
        var _a;
        return ((_a = block.value) == null ? void 0 : _a.name.toLowerCase().includes("private use")) ?? false;
      }
    );
    async function loadData() {
      const allBlocks = await loadAllBlocks();
      const found = allBlocks.find((b) => {
        const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return slug === blockSlugParam.value;
      });
      if (found) {
        block.value = found;
        characters.value = await loadBlockCharacters(found.name);
      } else {
        block.value = null;
      }
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch(blockSlugParam, loadData);
    useHead(() => ({
      title: block.value ? `${blockDisplayName(block.value.name)} — Unicode Block` : "Unicode Block — Fontist",
      meta: [
        { property: "og:title", content: block.value ? blockDisplayName(block.value.name) : "Unicode Block" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: `https://www.fontist.org/unicode/block/${blockSlugParam.value}` }
      ]
    }));
    function goToChar(cp) {
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      router.push(`/unicode/char/${hex}`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (block.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "ubp" }, _attrs))} data-v-d5c616c1><header class="ubp-head" data-v-d5c616c1>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/unicode",
          class: "ubp-back"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Unicode Browser`);
            } else {
              return [
                createTextVNode("← Unicode Browser")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 data-v-d5c616c1>${ssrInterpolate(unref(blockDisplayName)(block.value.name))}</h1><span class="ubp-meta" data-v-d5c616c1>${ssrInterpolate(unref(hexCp)(block.value.start))}–${ssrInterpolate(unref(hexCp)(block.value.end))} · ${ssrInterpolate(characters.value.length)} assigned characters</span></header><div class="ubp-script" data-v-d5c616c1>${ssrInterpolate(unref(scriptGroup)(block.value.name))}</div>`);
        if (isPrivateUse.value && characters.value.length === 0) {
          _push(`<div class="ubp-pua-notice" data-v-d5c616c1><h2 data-v-d5c616c1>Private Use Area — No Assigned Characters</h2><p data-v-d5c616c1> Codepoints in this range are <strong data-v-d5c616c1>not assigned</strong> by the Unicode Standard. They are reserved for private, corporate, or application-specific use. </p><p data-v-d5c616c1> Font developers and organizations may define their own glyphs here, but these assignments are not portable across systems. The Unicode Standard guarantees these codepoints will never be assigned characters. </p><p class="ubp-pua-link" data-v-d5c616c1><a${ssrRenderAttr("href", `https://www.unicode.org/versions/latest/charts/`)} target="_blank" rel="noopener" data-v-d5c616c1> Unicode Standard documentation ↗ </a></p></div>`);
        } else if (blockWithChars.value) {
          _push(ssrRenderComponent(UnicodeBlockGrid, {
            block: blockWithChars.value,
            mode: "standalone",
            "max-chars": 1e4,
            onSelect: goToChar
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "ubp-loading" }, _attrs))} data-v-d5c616c1>Block &quot;${ssrInterpolate(blockSlugParam.value)}&quot; not found.</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/UnicodeBlockPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const UnicodeBlockPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d5c616c1"]]);
export {
  UnicodeBlockPage as default
};
