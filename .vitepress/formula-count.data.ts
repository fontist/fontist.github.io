// Build-time data loader: fetches live formula/font counts from the
// formulas subsite's stats.json. Falls back to static numbers if the
// fetch fails (offline build, formulas site down, etc.).
export default {
  async load() {
    const fallback = { formulaCount: 4283, openSourceCount: 2143 };
    try {
      const res = await fetch(
        "https://www.fontist.org/formulas/stats.json",
      );
      if (!res.ok) return fallback;
      const data = await res.json();
      return {
        formulaCount: data.total || fallback.formulaCount,
        openSourceCount: data.licenses?.open_source || fallback.openSourceCount,
      };
    } catch {
      return fallback;
    }
  },
};
