import { defineComponent, ref, computed, withAsyncContext, watch, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { m as safeChar, h as hexCp } from "./constants-CAbDY4oD.js";
import { f as fetchJson } from "./ssr-fetch-DJg5wTjq.js";
import { U as UnicodeBlockGrid } from "./UnicodeBlockGrid-SKtCUWXV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PropertyDetailPage",
  __ssrInlineRender: true,
  props: {
    property: {},
    title: {}
  },
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const router = useRouter();
    const props = __props;
    const data = ref(null);
    const valueParam = computed(() => route.params.code);
    const indexUrl = computed(() => `unicode/indexes/${props.property}/${valueParam.value}.json`);
    const blockWithChars = computed(() => {
      if (!data.value) return null;
      return {
        name: `${props.title}: ${valueParam.value}`,
        start: 0,
        end: 1114111,
        range: "",
        plane: "bmp",
        displayName: `${props.title}: ${valueParam.value}`,
        scriptGroup: "",
        characters: data.value.characters.map((c) => ({
          cp: c.cp,
          hex: hexCp(c.cp),
          char: safeChar(c.cp),
          name: c.n || "",
          category: "",
          script: ""
        })),
        assignedCount: data.value.characters.length,
        unicodeVersion: ""
      };
    });
    async function loadData() {
      data.value = null;
      try {
        data.value = await fetchJson(indexUrl.value);
      } catch (e) {
        console.error(e);
      }
    }
    [__temp, __restore] = withAsyncContext(() => loadData()), await __temp, __restore();
    watch([valueParam, () => props.property], loadData);
    useHead(() => ({
      title: data.value ? `${props.title}: ${valueParam.value} (${data.value.count.toLocaleString()} chars) — Unicode` : `${props.title}: ${valueParam.value} — Unicode`,
      link: [
        { rel: "canonical", href: `https://www.fontist.org/unicode/${props.property}/${valueParam.value}` }
      ]
    }));
    function goToChar(cp) {
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      router.push(`/unicode/char/${hex}`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (data.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "pdp" }, _attrs))} data-v-77db5f36><header class="pdp-head" data-v-77db5f36>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: "/unicode",
          class: "pdp-back"
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
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/${__props.property}`,
          class: "pdp-up"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(__props.title)} ↑`);
            } else {
              return [
                createTextVNode(toDisplayString(__props.title) + " ↑", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 data-v-77db5f36>${ssrInterpolate(valueParam.value)}</h1><span class="pdp-count" data-v-77db5f36>${ssrInterpolate(data.value.count.toLocaleString())} characters</span></header>`);
        if (blockWithChars.value) {
          _push(ssrRenderComponent(UnicodeBlockGrid, {
            block: blockWithChars.value,
            mode: "standalone",
            "max-chars": 1e5,
            onSelect: goToChar
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "pdp-loading" }, _attrs))} data-v-77db5f36>No characters found for &quot;${ssrInterpolate(valueParam.value)}&quot;.</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/PropertyDetailPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const PropertyDetailPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-77db5f36"]]);
export {
  PropertyDetailPage as default
};
