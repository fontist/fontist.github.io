import { defineComponent, computed, ref, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from "vue/server-renderer";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useHead } from "@unhead/vue";
import { P as PLANES, i as isControlChar, c as controlAbbrev, d as controlName, e as cEscape, a as blockSlug, b as blockDisplayName, h as hexCp, g as displayChar, j as categoryName, k as scriptDisplayName, l as combiningClassName, m as safeChar } from "./constants-CAbDY4oD.js";
import { l as loadAllBlocks, a as loadBlockCharacters } from "./loader-D6YbXYhV.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "UnicodeCharPage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    useRouter();
    const hex = computed(() => route.params.hex);
    const cp = computed(() => parseInt(hex.value, 16));
    const allBlocks = ref([]);
    const charData = ref(null);
    const allCharsInBlock = ref([]);
    const block = computed(() => allBlocks.value.find((b2) => cp.value >= b2.start && cp.value <= b2.end));
    const planeKey = computed(() => {
      var _a;
      return ((_a = block.value) == null ? void 0 : _a.plane) || "bmp";
    });
    const plane = computed(() => PLANES.find((p) => p.key === planeKey.value));
    const isControl = computed(() => {
      var _a;
      return isControlChar(((_a = charData.value) == null ? void 0 : _a.c) || "", cp.value);
    });
    const abbrev = computed(() => controlAbbrev(cp.value));
    const ctrlName = computed(() => controlName(cp.value));
    const escapeSeq = computed(() => cEscape(cp.value));
    const displayName = computed(() => {
      var _a;
      if (isControl.value && ctrlName.value) {
        return `<${ctrlName.value}>`;
      }
      return ((_a = charData.value) == null ? void 0 : _a.n) || "";
    });
    const charIndex = computed(() => allCharsInBlock.value.findIndex((c) => c.cp === cp.value));
    const prevCp = computed(() => charIndex.value > 0 ? allCharsInBlock.value[charIndex.value - 1] : null);
    const nextCp = computed(() => charIndex.value >= 0 && charIndex.value < allCharsInBlock.value.length - 1 ? allCharsInBlock.value[charIndex.value + 1] : null);
    const utf8 = computed(() => {
      const buf = new TextEncoder().encode(String.fromCodePoint(cp.value));
      return Array.from(buf).map((b2) => "0x" + b2.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    });
    const utf16 = computed(() => {
      const cpVal = cp.value;
      if (cpVal <= 65535) return "0x" + cpVal.toString(16).toUpperCase().padStart(4, "0");
      const offset = cpVal - 65536;
      const hi = 55296 + (offset >> 10);
      const lo = 56320 + (offset & 1023);
      return "0x" + hi.toString(16).toUpperCase().padStart(4, "0") + " 0x" + lo.toString(16).toUpperCase().padStart(4, "0");
    });
    const urlEncoded = computed(() => encodeURIComponent(String.fromCodePoint(cp.value)));
    const bidiNames = {
      L: "Left-to-Right",
      R: "Right-to-Left",
      AL: "Right-to-Left Arabic",
      EN: "European Number",
      ES: "European Separator",
      ET: "European Terminator",
      AN: "Arabic Number",
      CS: "Common Separator",
      NSM: "Nonspacing Mark",
      BN: "Boundary Neutral",
      B: "Paragraph Separator",
      S: "Segment Separator",
      WS: "Whitespace",
      ON: "Other Neutral",
      LRE: "L-to-R Embedding",
      LRO: "L-to-R Override",
      RLE: "R-to-L Embedding",
      RLO: "R-to-L Override",
      PDF: "Pop Directional Format",
      LRI: "L-to-R Isolate",
      RLI: "R-to-L Isolate",
      FSI: "First Strong Isolate",
      PDI: "Pop Directional Isolate"
    };
    allBlocks.value = ([__temp, __restore] = withAsyncContext(() => loadAllBlocks()), __temp = await __temp, __restore(), __temp);
    const b = block.value;
    if (b) {
      allCharsInBlock.value = ([__temp, __restore] = withAsyncContext(() => loadBlockCharacters(b.name)), __temp = await __temp, __restore(), __temp);
      charData.value = allCharsInBlock.value.find((c) => c.cp === cp.value);
    }
    useHead(() => {
      var _a, _b;
      return {
        title: ((_a = charData.value) == null ? void 0 : _a.n) ? `U+${hex.value.toUpperCase()} ${charData.value.n} — Unicode Character` : `U+${hex.value.toUpperCase()} — Unicode Character`,
        meta: [
          { property: "og:title", content: `U+${hex.value.toUpperCase()}${((_b = charData.value) == null ? void 0 : _b.n) ? " " + charData.value.n : ""}` },
          { property: "og:type", content: "website" }
        ],
        link: [
          { rel: "canonical", href: `https://www.fontist.org/unicode/char/${hex.value}` }
        ]
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      if (charData.value) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "ucp" }, _attrs))} data-v-d5379196><nav class="ucp-crumbs" data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), { to: "/unicode" }, {
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
        _push(`<span data-v-d5379196>›</span>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/plane/${planeKey.value}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            var _a2, _b2;
            if (_push2) {
              _push2(`${ssrInterpolate((_a2 = plane.value) == null ? void 0 : _a2.shortName)}`);
            } else {
              return [
                createTextVNode(toDisplayString((_b2 = plane.value) == null ? void 0 : _b2.shortName), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<span data-v-d5379196>›</span>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/block/${unref(blockSlug)(block.value.name)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(blockDisplayName)(block.value.name))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(blockDisplayName)(block.value.name)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<span data-v-d5379196>›</span><span class="ucp-crumb-current" data-v-d5379196>${ssrInterpolate(unref(hexCp)(cp.value))}</span></nav><div class="ucp-nav" data-v-d5379196>`);
        if (prevCp.value) {
          _push(`<button class="ucp-nav-btn ucp-prev" data-v-d5379196> ← `);
          if (!unref(isControlChar)(prevCp.value.c || "", prevCp.value.cp)) {
            _push(`<span class="ucp-nav-glyph" data-v-d5379196>${ssrInterpolate(unref(displayChar)(prevCp.value.cp, prevCp.value.c || ""))}</span>`);
          } else {
            _push(`<span class="ucp-nav-glyph ucp-nav-ctrl" data-v-d5379196>${ssrInterpolate(unref(controlAbbrev)(prevCp.value.cp))}</span>`);
          }
          _push(`<span class="ucp-nav-hex" data-v-d5379196>${ssrInterpolate(unref(hexCp)(prevCp.value.cp))}</span></button>`);
        } else {
          _push(`<span class="ucp-nav-spacer" data-v-d5379196></span>`);
        }
        _push(`<span class="ucp-nav-current" data-v-d5379196>${ssrInterpolate(unref(hexCp)(cp.value))}</span>`);
        if (nextCp.value) {
          _push(`<button class="ucp-nav-btn ucp-next" data-v-d5379196>`);
          if (!unref(isControlChar)(nextCp.value.c || "", nextCp.value.cp)) {
            _push(`<span class="ucp-nav-glyph" data-v-d5379196>${ssrInterpolate(unref(displayChar)(nextCp.value.cp, nextCp.value.c || ""))}</span>`);
          } else {
            _push(`<span class="ucp-nav-glyph ucp-nav-ctrl" data-v-d5379196>${ssrInterpolate(unref(controlAbbrev)(nextCp.value.cp))}</span>`);
          }
          _push(`<span class="ucp-nav-hex" data-v-d5379196>${ssrInterpolate(unref(hexCp)(nextCp.value.cp))}</span> → </button>`);
        } else {
          _push(`<span class="ucp-nav-spacer" data-v-d5379196></span>`);
        }
        _push(`</div><div class="ucp-glyph-area" data-v-d5379196>`);
        if (!isControl.value) {
          _push(`<div class="ucp-glyph-stage" data-v-d5379196><div class="ucp-guides" data-v-d5379196><span class="ucp-guide ucp-guide--cap" title="Cap height" data-v-d5379196></span><span class="ucp-guide ucp-guide--xheight" title="x-height" data-v-d5379196></span><span class="ucp-guide ucp-guide--baseline" title="Baseline" data-v-d5379196></span></div><span class="ucp-glyph" data-v-d5379196>${ssrInterpolate(unref(displayChar)(cp.value, charData.value.c))}</span></div>`);
        } else {
          _push(`<span class="ucp-control-box" data-v-d5379196>${ssrInterpolate(abbrev.value)}</span>`);
        }
        _push(`</div><h1 class="ucp-name" data-v-d5379196>${ssrInterpolate(displayName.value)} `);
        if (isControl.value && abbrev.value) {
          _push(`<span class="ucp-name-abbrev" data-v-d5379196>(${ssrInterpolate(abbrev.value)})</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</h1><code class="ucp-hex" data-v-d5379196>${ssrInterpolate(unref(hexCp)(cp.value))}</code><div class="ucp-sections" data-v-d5379196><section class="ucp-section" data-v-d5379196><h2 data-v-d5379196>Classification</h2><dl data-v-d5379196>`);
        if ((_a = block.value) == null ? void 0 : _a.unicodeVersion) {
          _push(`<dt data-v-d5379196>Unicode Version</dt>`);
        } else {
          _push(`<!---->`);
        }
        if ((_b = block.value) == null ? void 0 : _b.unicodeVersion) {
          _push(`<dd data-v-d5379196>${ssrInterpolate(block.value.unicodeVersion)}</dd>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<dt data-v-d5379196>Category</dt><dd data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/category/${charData.value.c}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(categoryName)(charData.value.c))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(categoryName)(charData.value.c)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` <code data-v-d5379196>${ssrInterpolate(charData.value.c)}</code></dd><dt data-v-d5379196>Script</dt><dd data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/scripts/${charData.value.s}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(scriptDisplayName)(charData.value.s))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(scriptDisplayName)(charData.value.s)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</dd><dt data-v-d5379196>Block</dt><dd data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/block/${unref(blockSlug)(block.value.name)}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(blockDisplayName)(block.value.name))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(blockDisplayName)(block.value.name)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</dd><dt data-v-d5379196>Plane</dt><dd data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/plane/${planeKey.value}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            var _a2, _b2, _c, _d;
            if (_push2) {
              _push2(`${ssrInterpolate((_a2 = plane.value) == null ? void 0 : _a2.name)} (${ssrInterpolate((_b2 = plane.value) == null ? void 0 : _b2.shortName)})`);
            } else {
              return [
                createTextVNode(toDisplayString((_c = plane.value) == null ? void 0 : _c.name) + " (" + toDisplayString((_d = plane.value) == null ? void 0 : _d.shortName) + ")", 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</dd>`);
        if (charData.value.bc) {
          _push(`<dt data-v-d5379196>Bidirectional</dt>`);
        } else {
          _push(`<!---->`);
        }
        if (charData.value.bc) {
          _push(`<dd data-v-d5379196>`);
          _push(ssrRenderComponent(unref(RouterLink), {
            to: `/unicode/bidiclass/${charData.value.bc}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(bidiNames[charData.value.bc] || charData.value.bc)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(bidiNames[charData.value.bc] || charData.value.bc), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(` <code data-v-d5379196>${ssrInterpolate(charData.value.bc)}</code></dd>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<dt data-v-d5379196>Combining Class</dt><dd data-v-d5379196>`);
        _push(ssrRenderComponent(unref(RouterLink), {
          to: `/unicode/combining/${charData.value.cc || 0}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(combiningClassName)(charData.value.cc || 0))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(combiningClassName)(charData.value.cc || 0)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` <code data-v-d5379196>${ssrInterpolate(charData.value.cc || 0)}</code></dd>`);
        if (charData.value.mir) {
          _push(`<dt data-v-d5379196>Mirrored</dt>`);
        } else {
          _push(`<!---->`);
        }
        if (charData.value.mir) {
          _push(`<dd data-v-d5379196>Yes</dd>`);
        } else {
          _push(`<!---->`);
        }
        if (escapeSeq.value) {
          _push(`<dt data-v-d5379196>Escape Sequence</dt>`);
        } else {
          _push(`<!---->`);
        }
        if (escapeSeq.value) {
          _push(`<dd data-v-d5379196><code data-v-d5379196>${ssrInterpolate(escapeSeq.value)}</code></dd>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</dl></section><section class="ucp-section" data-v-d5379196><h2 data-v-d5379196>Encodings</h2><dl data-v-d5379196><dt data-v-d5379196>HTML Decimal</dt><dd data-v-d5379196><code data-v-d5379196>&amp;#${ssrInterpolate(cp.value)};</code></dd><dt data-v-d5379196>HTML Hex</dt><dd data-v-d5379196><code data-v-d5379196>&amp;#x${ssrInterpolate(hex.value)};</code></dd><dt data-v-d5379196>CSS Escape</dt><dd data-v-d5379196><code data-v-d5379196>\\${ssrInterpolate(hex.value)}</code></dd><dt data-v-d5379196>JavaScript</dt><dd data-v-d5379196><code data-v-d5379196>\\u${ssrInterpolate(hex.value)}</code></dd><dt data-v-d5379196>URL Encoded</dt><dd data-v-d5379196><code data-v-d5379196>${ssrInterpolate(urlEncoded.value)}</code></dd><dt data-v-d5379196>UTF-8</dt><dd data-v-d5379196><code data-v-d5379196>${ssrInterpolate(utf8.value)}</code></dd><dt data-v-d5379196>UTF-16</dt><dd data-v-d5379196><code data-v-d5379196>${ssrInterpolate(utf16.value)}</code></dd><dt data-v-d5379196>UTF-32</dt><dd data-v-d5379196><code data-v-d5379196>0x${ssrInterpolate(cp.value.toString(16).toUpperCase().padStart(8, "0"))}</code></dd></dl></section>`);
        if (charData.value.up || charData.value.lo || charData.value.ti) {
          _push(`<section class="ucp-section" data-v-d5379196><h2 data-v-d5379196>Case Mappings</h2><dl data-v-d5379196>`);
          if (charData.value.up) {
            _push(`<!--[--><dt data-v-d5379196>Uppercase</dt><dd data-v-d5379196>`);
            _push(ssrRenderComponent(unref(RouterLink), {
              to: `/unicode/char/${charData.value.up.toUpperCase().padStart(4, "0")}`
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(safeChar)(parseInt(charData.value.up, 16)))} ${ssrInterpolate(unref(hexCp)(parseInt(charData.value.up, 16)))}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(safeChar)(parseInt(charData.value.up, 16))) + " " + toDisplayString(unref(hexCp)(parseInt(charData.value.up, 16))), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</dd><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (charData.value.lo) {
            _push(`<!--[--><dt data-v-d5379196>Lowercase</dt><dd data-v-d5379196>`);
            _push(ssrRenderComponent(unref(RouterLink), {
              to: `/unicode/char/${charData.value.lo.toUpperCase().padStart(4, "0")}`
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(safeChar)(parseInt(charData.value.lo, 16)))} ${ssrInterpolate(unref(hexCp)(parseInt(charData.value.lo, 16)))}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(safeChar)(parseInt(charData.value.lo, 16))) + " " + toDisplayString(unref(hexCp)(parseInt(charData.value.lo, 16))), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</dd><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (charData.value.ti) {
            _push(`<!--[--><dt data-v-d5379196>Title Case</dt><dd data-v-d5379196>`);
            _push(ssrRenderComponent(unref(RouterLink), {
              to: `/unicode/char/${charData.value.ti.toUpperCase().padStart(4, "0")}`
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(safeChar)(parseInt(charData.value.ti, 16)))} ${ssrInterpolate(unref(hexCp)(parseInt(charData.value.ti, 16)))}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(safeChar)(parseInt(charData.value.ti, 16))) + " " + toDisplayString(unref(hexCp)(parseInt(charData.value.ti, 16))), 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</dd><!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</dl></section>`);
        } else {
          _push(`<!---->`);
        }
        if (charData.value.dm) {
          _push(`<section class="ucp-section" data-v-d5379196><h2 data-v-d5379196>Decomposition</h2><dl data-v-d5379196><dt data-v-d5379196>Decomposes To</dt><dd data-v-d5379196><!--[-->`);
          ssrRenderList(charData.value.dm.split(" "), (part, i) => {
            _push(`<!--[-->`);
            if (part.match(/^[0-9A-Fa-f]+$/)) {
              _push(ssrRenderComponent(unref(RouterLink), {
                to: `/unicode/char/${part.toUpperCase().padStart(4, "0")}`
              }, {
                default: withCtx((_, _push2, _parent2, _scopeId) => {
                  if (_push2) {
                    _push2(`${ssrInterpolate(unref(safeChar)(parseInt(part, 16)))}`);
                  } else {
                    return [
                      createTextVNode(toDisplayString(unref(safeChar)(parseInt(part, 16))), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            } else {
              _push(`<code data-v-d5379196>${ssrInterpolate(part)}</code>`);
            }
            if (i < charData.value.dm.split(" ").length - 1) {
              _push(`<span data-v-d5379196></span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          });
          _push(`<!--]--></dd></dl></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else if (!_ctx.loading) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "ucp-notfound" }, _attrs))} data-v-d5379196> Character U+${ssrInterpolate(hex.value)} not found. `);
        _push(ssrRenderComponent(unref(RouterLink), { to: "/unicode" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`← Browse Unicode`);
            } else {
              return [
                createTextVNode("← Browse Unicode")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "ucp-loading" }, _attrs))} data-v-d5379196>Loading…</div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/UnicodeCharPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const UnicodeCharPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d5379196"]]);
export {
  UnicodeCharPage as default
};
