import { defineComponent, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderAttr } from "vue/server-renderer";
import { i as isControlChar, c as controlAbbrev, g as displayChar, d as controlName } from "./constants-CAbDY4oD.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UnicodeBlockGrid",
  __ssrInlineRender: true,
  props: {
    block: {},
    fonts: { default: () => [] },
    mode: { default: "standalone" },
    showMissing: { type: Boolean, default: true },
    maxChars: { default: 512 }
  },
  emits: ["select"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const cells = computed(() => {
      const chars = props.block.characters.slice(0, props.maxChars);
      return chars.map((c) => {
        const renders = props.fonts.map((f) => ({ font: f, supported: f.coverage.has(c.cp) }));
        const hasAny = renders.some((r) => r.supported);
        const hasAll = renders.length > 0 && renders.every((r) => r.supported);
        return { char: c, renders, hasAny, hasAll };
      });
    });
    const visibleCells = computed(() => {
      if (props.mode === "multi-font" && props.showMissing) return cells.value;
      if (!props.showMissing && props.fonts.length > 0) {
        return cells.value.filter((c) => c.hasAny);
      }
      return cells.value;
    });
    computed(() => {
      if (props.fonts.length === 0) return {};
      const styles = {};
      props.fonts.forEach((f, i) => {
        if (f.fontPath && f.redistributable) {
          const id = `ub-${f.slug.replace(/[^a-z0-9]/gi, "-")}`;
          if (!document.getElementById(`ub-style-${id}`)) {
            const s = document.createElement("style");
            s.id = `ub-style-${id}`;
            s.textContent = `@font-face{font-family:'${id}';src:url('${f.fontPath}') format('woff');font-weight:100 900;font-display:swap;}`;
            document.head.appendChild(s);
          }
          styles[f.slug] = `'${id}', sans-serif`;
        }
      });
      return styles;
    });
    function fontFamily(font) {
      const id = `ub-${font.slug.replace(/[^a-z0-9]/gi, "-")}`;
      return font.redistributable && font.fontPath ? `'${id}', sans-serif` : "sans-serif";
    }
    function displayName(char) {
      if (isControlChar(char.category, char.cp)) {
        return controlName(char.cp) || char.name;
      }
      return char.name;
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "ub-container" }, _attrs))} data-v-8f6b0df1>`);
      if (__props.fonts.length > 0 && __props.mode !== "standalone") {
        _push(`<div class="ub-legend" data-v-8f6b0df1><div class="ub-legend-item" data-v-8f6b0df1><span class="ub-legend-swatch ub-legend-swatch--ok" data-v-8f6b0df1></span><span data-v-8f6b0df1>In ${ssrInterpolate(((_a = __props.fonts[0]) == null ? void 0 : _a.familyName) || "font")}</span></div><div class="ub-legend-item" data-v-8f6b0df1><span class="ub-legend-swatch ub-legend-swatch--no" data-v-8f6b0df1></span><span data-v-8f6b0df1>Not in font</span></div><span class="ub-legend-hint" data-v-8f6b0df1>Click any character for full details →</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="ub-grid" data-v-8f6b0df1><!--[-->`);
      ssrRenderList(visibleCells.value, (cell) => {
        _push(`<button class="${ssrRenderClass(["ub-cell", { missing: !cell.hasAny && __props.fonts.length > 0 }])}" data-v-8f6b0df1><span class="ub-cp" data-v-8f6b0df1>${ssrInterpolate(cell.char.hex)}</span>`);
        if (!cell.hasAny && __props.fonts.length > 0) {
          _push(`<span class="ub-missing-badge" data-v-8f6b0df1>✗</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.mode === "standalone" || __props.fonts.length === 0) {
          _push(`<!--[-->`);
          if (unref(isControlChar)(cell.char.category, cell.char.cp)) {
            _push(`<div class="ub-glyph-box" data-v-8f6b0df1><div class="ub-guides" data-v-8f6b0df1><span class="ub-guide ub-guide--cap" data-v-8f6b0df1></span><span class="ub-guide ub-guide--xheight" data-v-8f6b0df1></span><span class="ub-guide ub-guide--baseline" data-v-8f6b0df1></span></div><span class="ub-control-box" data-v-8f6b0df1>${ssrInterpolate(unref(controlAbbrev)(cell.char.cp))}</span></div>`);
          } else {
            _push(`<div class="ub-glyph-box" data-v-8f6b0df1><div class="ub-guides" data-v-8f6b0df1><span class="ub-guide ub-guide--cap" data-v-8f6b0df1></span><span class="ub-guide ub-guide--xheight" data-v-8f6b0df1></span><span class="ub-guide ub-guide--baseline" data-v-8f6b0df1></span></div><span class="ub-glyph" data-v-8f6b0df1>${ssrInterpolate(unref(displayChar)(cell.char.cp, cell.char.category))}</span></div>`);
          }
          _push(`<!--]-->`);
        } else if (__props.mode === "per-font" && __props.fonts.length === 1) {
          _push(`<!--[-->`);
          if (unref(isControlChar)(cell.char.category, cell.char.cp)) {
            _push(`<div class="ub-glyph-box" data-v-8f6b0df1><div class="ub-guides" data-v-8f6b0df1><span class="ub-guide ub-guide--cap" data-v-8f6b0df1></span><span class="ub-guide ub-guide--xheight" data-v-8f6b0df1></span><span class="ub-guide ub-guide--baseline" data-v-8f6b0df1></span></div><span class="ub-control-box" style="${ssrRenderStyle({ opacity: cell.renders[0].supported ? 1 : 0.3 })}" data-v-8f6b0df1>${ssrInterpolate(unref(controlAbbrev)(cell.char.cp))}</span></div>`);
          } else {
            _push(`<div class="ub-glyph-box" data-v-8f6b0df1><div class="ub-guides" data-v-8f6b0df1><span class="ub-guide ub-guide--cap" data-v-8f6b0df1></span><span class="ub-guide ub-guide--xheight" data-v-8f6b0df1></span><span class="ub-guide ub-guide--baseline" data-v-8f6b0df1></span></div><span class="ub-glyph" style="${ssrRenderStyle({ fontFamily: cell.renders[0].supported ? fontFamily(__props.fonts[0]) : "sans-serif", opacity: cell.renders[0].supported ? 1 : 0.3 })}" data-v-8f6b0df1>${ssrInterpolate(unref(displayChar)(cell.char.cp, cell.char.category))}</span></div>`);
          }
          _push(`<!--]-->`);
        } else {
          _push(`<div class="ub-multi" data-v-8f6b0df1><!--[-->`);
          ssrRenderList(cell.renders, (r) => {
            _push(`<span class="ub-glyph-mini" style="${ssrRenderStyle({ fontFamily: r.supported ? fontFamily(r.font) : "sans-serif", opacity: r.supported ? 1 : 0.15, color: r.supported ? "inherit" : r.font.color })}"${ssrRenderAttr("title", r.font.familyName + (r.supported ? "" : " — missing"))} data-v-8f6b0df1>${ssrInterpolate(cell.char.char)}</span>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`<span class="ub-name" data-v-8f6b0df1>${ssrInterpolate(displayName(cell.char))}</span></button>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/lib/unicode/components/UnicodeBlockGrid.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const UnicodeBlockGrid = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-8f6b0df1"]]);
export {
  UnicodeBlockGrid as U
};
