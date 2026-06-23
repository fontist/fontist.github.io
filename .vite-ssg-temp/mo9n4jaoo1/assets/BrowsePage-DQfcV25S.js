import { ref, onMounted, computed, mergeProps, unref, withCtx, createVNode, toDisplayString, createTextVNode, useSSRContext, defineComponent } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderClass, ssrRenderComponent } from "vue/server-renderer";
import { RouterLink } from "vue-router";
import { l as loadAllFormulas } from "./loader-BaXvckyu.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import { useHead } from "@unhead/vue";
import "./ssr-fetch-DJg5wTjq.js";
const _sfc_main$1 = {
  __name: "FormulaBrowser",
  __ssrInlineRender: true,
  setup(__props) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const formulasData = ref([]);
    const searchQuery = ref("");
    const selectedLicenses = ref(["all"]);
    const selectedSources = ref(["all"]);
    const licenseOptions = [
      { value: "all", label: "All Licenses", icon: "all", count: 0 },
      { value: "ofl", label: "OFL 1.1", icon: "ofl", count: 0 },
      { value: "apache", label: "Apache 2.0", icon: "apache", count: 0 },
      { value: "mit", label: "MIT", icon: "mit", count: 0 },
      { value: "cc0", label: "CC0 / Public Domain", icon: "cc0", count: 0 },
      { value: "other_open", label: "Other Open Source", icon: "open", count: 0 },
      { value: "freely_dist", label: "Freely Distributable", icon: "free", count: 0 },
      { value: "platform", label: "Platform Tied", icon: "platform", count: 0 },
      { value: "bundled", label: "Bundled Software", icon: "bundled", count: 0 },
      { value: "unknown", label: "License Not Specified", icon: "unknown", count: 0 }
    ];
    const sourceOptions = [
      { value: "all", label: "All Sources", icon: "all", count: 0 },
      { value: "google", label: "Google Fonts", icon: "google", count: 0 },
      { value: "sil", label: "SIL International", icon: "sil", count: 0 },
      { value: "macos", label: "Apple", icon: "apple", count: 0 },
      { value: "manual", label: "Expert Curated", icon: "fontist", count: 0 }
    ];
    const licenseParamMap = {
      "open_source": ["ofl", "apache", "mit", "cc0", "other_open"],
      "freely_distributable": ["freely_dist"],
      "platform_restricted": ["platform"],
      "bundled_software": ["bundled"],
      "ofl": ["ofl"],
      "apache": ["apache"],
      "mit": ["mit"]
    };
    function getLicenseGroup(f) {
      if (!f) return "unknown";
      if (f.licenseCategory === "open_source") {
        if (f.licenseType === "ofl") return "ofl";
        if (f.licenseType === "apache") return "apache";
        if (f.licenseType === "mit") return "mit";
        if (f.licenseType === "cc0") return "cc0";
        return "other_open";
      }
      if (f.licenseCategory === "freely_distributable") return "freely_dist";
      if (f.licenseCategory === "platform_restricted") return "platform";
      if (f.licenseCategory === "bundled_software") return "bundled";
      return "unknown";
    }
    function getLicenseBadge(f) {
      const basePath = "/";
      if (!f) return `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="license-icon" title="Unknown">`;
      if (f.licenseType === "ofl") return `<img src="${basePath}licenses/ofl.svg" alt="OFL" class="license-icon" title="OFL">`;
      if (f.licenseType === "apache") return `<img src="${basePath}licenses/apache.svg" alt="Apache" class="license-icon" title="Apache">`;
      if (f.licenseType === "mit") return `<img src="${basePath}licenses/mit.svg" alt="MIT" class="license-icon" title="MIT">`;
      if (f.licenseType === "cc0") return `<img src="${basePath}licenses/cc0.svg" alt="CC0" class="license-icon" title="CC0">`;
      if (f.licenseType === "macos") return `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="license-icon" title="Platform Tied">`;
      if (f.licenseType === "ms_office" || f.licenseType === "ms_web_fonts") return `<img src="${basePath}licenses/microsoft.svg" alt="Microsoft" class="license-icon" title="Microsoft">`;
      if (f.licenseCategory === "open_source") return `<img src="${basePath}licenses/open.svg" alt="Open Source" class="license-icon" title="Open Source">`;
      if (f.licenseCategory === "freely_distributable") return `<img src="${basePath}licenses/freely-distributed.svg" alt="Freely Distributable" class="license-icon" title="Freely Distributable">`;
      if (f.licenseCategory === "platform_restricted") return `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="license-icon" title="Platform Tied">`;
      if (f.licenseCategory === "bundled_software") return `<img src="${basePath}licenses/bundled.svg" alt="Bundled" class="license-icon" title="Bundled Software">`;
      return `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="license-icon" title="Unknown">`;
    }
    function getSourceBadge(f) {
      const basePath = "/";
      if (!f) return `<img src="${basePath}sources/fontist.svg" alt="Expert Curated" class="source-icon" title="Expert Curated">`;
      if (f.sourceType === "google") return `<img src="${basePath}sources/google.svg" alt="Google Fonts" class="source-icon" title="Google Fonts">`;
      if (f.sourceType === "sil") return `<img src="${basePath}sources/sil.svg" alt="SIL International" class="source-icon" title="SIL International">`;
      if (f.sourceType === "macos") return `<img src="${basePath}sources/apple.svg" alt="Apple" class="source-icon" title="Apple">`;
      return `<img src="${basePath}sources/fontist.svg" alt="Expert Curated" class="source-icon" title="Expert Curated">`;
    }
    function getSourceIcon(icon) {
      const basePath = "/";
      const icons = {
        all: `<img src="${basePath}sources/all.svg" alt="All" class="filter-icon-img">`,
        google: `<img src="${basePath}sources/google.svg" alt="Google" class="filter-icon-img">`,
        sil: `<img src="${basePath}sources/sil.svg" alt="SIL" class="filter-icon-img">`,
        apple: `<img src="${basePath}sources/apple.svg" alt="Apple" class="filter-icon-img">`,
        fontist: `<img src="${basePath}sources/fontist.svg" alt="Fontist" class="filter-icon-img">`
      };
      return icons[icon] || icon;
    }
    function getLicenseIcon(icon) {
      const basePath = "/";
      const icons = {
        all: `<img src="${basePath}licenses/open.svg" alt="All" class="filter-icon-img">`,
        ofl: `<img src="${basePath}licenses/ofl.svg" alt="OFL" class="filter-icon-img">`,
        apache: `<img src="${basePath}licenses/apache.svg" alt="Apache" class="filter-icon-img">`,
        mit: `<img src="${basePath}licenses/mit.svg" alt="MIT" class="filter-icon-img">`,
        cc0: `<img src="${basePath}licenses/cc0.svg" alt="CC0" class="filter-icon-img">`,
        open: `<img src="${basePath}licenses/open.svg" alt="Open Source" class="filter-icon-img">`,
        free: `<img src="${basePath}licenses/freely-distributed.svg" alt="Free" class="filter-icon-img">`,
        platform: `<img src="${basePath}licenses/platform-tied.svg" alt="Platform Tied" class="filter-icon-img">`,
        bundled: `<img src="${basePath}licenses/bundled.svg" alt="Bundled" class="filter-icon-img">`,
        unknown: `<img src="${basePath}licenses/unknown.svg" alt="Unknown" class="filter-icon-img">`
      };
      return icons[icon] || icon;
    }
    function initFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) {
        searchQuery.value = q;
      }
      const license = params.get("license");
      if (license && licenseParamMap[license]) {
        selectedLicenses.value = licenseParamMap[license];
      }
      const source = params.get("source");
      if (source) {
        const srcOpt = sourceOptions.find((o) => o.value === source);
        if (srcOpt) {
          selectedSources.value = [source];
        }
      }
    }
    onMounted(async () => {
      try {
        initFromUrl();
        const data = await loadAllFormulas();
        formulasData.value = data;
        licenseOptions[0].count = data.length;
        sourceOptions[0].count = data.length;
        data.forEach((f) => {
          const licOpt = licenseOptions.find((o) => o.value === getLicenseGroup(f));
          if (licOpt) licOpt.count++;
          const srcOpt = sourceOptions.find((o) => o.value === f.sourceType);
          if (srcOpt) srcOpt.count++;
        });
      } catch (e) {
        console.error("Failed to load formulas data:", e);
      }
    });
    const filteredFormulas = computed(() => {
      let result = formulasData.value;
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(
          (f) => (f.name || "").toLowerCase().includes(q) || (f.formulaName || "").toLowerCase().includes(q) || (f.familyNames || []).some((n) => (n || "").toLowerCase().includes(q))
        );
      }
      if (!selectedLicenses.value.includes("all")) {
        result = result.filter((f) => selectedLicenses.value.includes(getLicenseGroup(f)));
      }
      if (!selectedSources.value.includes("all")) {
        result = result.filter((f) => selectedSources.value.includes(f.sourceType));
      }
      return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    const groupedFormulas = computed(() => {
      const groups = {};
      filteredFormulas.value.forEach((f) => {
        if (!f || !f.name) return;
        const letter = f.name.charAt(0).toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(f);
      });
      return groups;
    });
    const activeLetters = computed(() => {
      return alphabet.filter((letter) => {
        const group = groupedFormulas.value[letter];
        return group && group.length > 0;
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "formulas-browser" }, _attrs))} data-v-1af3472f><div class="search-container" data-v-1af3472f><input${ssrRenderAttr("value", searchQuery.value)} type="text" placeholder="Search fonts by name, family, or formula key..." class="search-input" data-v-1af3472f><span class="result-count" data-v-1af3472f>${ssrInterpolate(filteredFormulas.value.length)} formulas</span></div><div class="browser-layout" data-v-1af3472f><aside class="filters-sidebar" data-v-1af3472f><div class="filter-section" data-v-1af3472f><h4 data-v-1af3472f>License</h4><!--[-->`);
      ssrRenderList(licenseOptions, (opt) => {
        _push(`<label class="filter-checkbox" data-v-1af3472f><input type="checkbox"${ssrIncludeBooleanAttr(selectedLicenses.value.includes(opt.value)) ? " checked" : ""} data-v-1af3472f><span class="filter-label" data-v-1af3472f><span class="filter-icon" data-v-1af3472f>${getLicenseIcon(opt.icon) ?? ""}</span> ${ssrInterpolate(opt.label)} <span class="filter-count" data-v-1af3472f>(${ssrInterpolate(opt.count)})</span></span></label>`);
      });
      _push(`<!--]--></div><div class="filter-section" data-v-1af3472f><h4 data-v-1af3472f>Source</h4><!--[-->`);
      ssrRenderList(sourceOptions, (opt) => {
        _push(`<label class="filter-checkbox" data-v-1af3472f><input type="checkbox"${ssrIncludeBooleanAttr(selectedSources.value.includes(opt.value)) ? " checked" : ""} data-v-1af3472f><span class="filter-label" data-v-1af3472f><span class="filter-icon" data-v-1af3472f>${getSourceIcon(opt.icon) ?? ""}</span> ${ssrInterpolate(opt.label)} <span class="filter-count" data-v-1af3472f>(${ssrInterpolate(opt.count)})</span></span></label>`);
      });
      _push(`<!--]--></div></aside><main class="results-main" data-v-1af3472f><nav class="alpha-nav" data-v-1af3472f><!--[-->`);
      ssrRenderList(unref(alphabet), (letter) => {
        _push(`<button class="${ssrRenderClass({ "has-content": groupedFormulas.value[letter] })}"${ssrIncludeBooleanAttr(!groupedFormulas.value[letter]) ? " disabled" : ""} data-v-1af3472f>${ssrInterpolate(letter)}</button>`);
      });
      _push(`<!--]--></nav><div class="formula-list" data-v-1af3472f><!--[-->`);
      ssrRenderList(activeLetters.value, (letter) => {
        _push(`<div${ssrRenderAttr("id", "letter-" + letter)} class="letter-group" data-v-1af3472f><h3 class="letter-heading" data-v-1af3472f>${ssrInterpolate(letter)}</h3><div class="formula-items" data-v-1af3472f><!--[-->`);
        ssrRenderList(groupedFormulas.value[letter], (f) => {
          _push(ssrRenderComponent(unref(RouterLink), {
            key: f.slug,
            to: `/font/${f.slug}`,
            class: "formula-item"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="formula-main" data-v-1af3472f${_scopeId}><span class="formula-name" data-v-1af3472f${_scopeId}>${ssrInterpolate(f.name)}</span><span class="formula-key" data-v-1af3472f${_scopeId}>${ssrInterpolate(f.formulaName)}</span></div><div class="formula-meta" data-v-1af3472f${_scopeId}><span class="formula-badges" data-v-1af3472f${_scopeId}><span${ssrRenderAttr("title", f.licenseName)} data-v-1af3472f${_scopeId}>${getLicenseBadge(f) ?? ""}</span> <span${ssrRenderAttr("title", f.sourceType)} data-v-1af3472f${_scopeId}>${getSourceBadge(f) ?? ""}</span></span><span class="formula-counts" data-v-1af3472f${_scopeId}>${ssrInterpolate(f.familyCount)} ${ssrInterpolate(f.familyCount === 1 ? "family" : "families")}, ${ssrInterpolate(f.styleCount)} ${ssrInterpolate(f.styleCount === 1 ? "style" : "styles")}</span></div>`);
              } else {
                return [
                  createVNode("div", { class: "formula-main" }, [
                    createVNode("span", { class: "formula-name" }, toDisplayString(f.name), 1),
                    createVNode("span", { class: "formula-key" }, toDisplayString(f.formulaName), 1)
                  ]),
                  createVNode("div", { class: "formula-meta" }, [
                    createVNode("span", { class: "formula-badges" }, [
                      createVNode("span", {
                        title: f.licenseName,
                        innerHTML: getLicenseBadge(f)
                      }, null, 8, ["title", "innerHTML"]),
                      createTextVNode(),
                      createVNode("span", {
                        title: f.sourceType,
                        innerHTML: getSourceBadge(f)
                      }, null, 8, ["title", "innerHTML"])
                    ]),
                    createVNode("span", { class: "formula-counts" }, toDisplayString(f.familyCount) + " " + toDisplayString(f.familyCount === 1 ? "family" : "families") + ", " + toDisplayString(f.styleCount) + " " + toDisplayString(f.styleCount === 1 ? "style" : "styles"), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></div>`);
      });
      _push(`<!--]--></div></main></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/FormulaBrowser.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const FormulaBrowser = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-1af3472f"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BrowsePage",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Browse Fonts — Fontist",
      meta: [
        { name: "description", content: "Browse 4,200+ openly-licensed font formulas. Filter by license, source, or search by name." },
        { property: "og:title", content: "Browse Fonts — Fontist" },
        { property: "og:type", content: "website" }
      ],
      link: [
        { rel: "canonical", href: "https://www.fontist.org/browse" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page-container" }, _attrs))}>`);
      _push(ssrRenderComponent(FormulaBrowser, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/BrowsePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
