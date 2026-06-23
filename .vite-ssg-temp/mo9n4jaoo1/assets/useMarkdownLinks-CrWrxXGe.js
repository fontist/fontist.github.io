import { onMounted, nextTick, onUpdated } from "vue";
import { useRouter } from "vue-router";
function useMarkdownLinks(containerRef) {
  const router = useRouter();
  function handleClick(e) {
    const target = e.target;
    const anchor = target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) return;
    const resolved = (() => {
      try {
        return new URL(href, window.location.href);
      } catch {
        return null;
      }
    })();
    if (!resolved) return;
    if (resolved.origin !== window.location.origin) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
      return;
    }
    e.preventDefault();
    const base = "/";
    const baseWithoutSlash = base.endsWith("/") ? base.slice(0, -1) : base;
    let path = resolved.pathname;
    if (baseWithoutSlash && path.startsWith(baseWithoutSlash)) {
      path = path.slice(baseWithoutSlash.length);
    }
    path += resolved.search + resolved.hash;
    router.push(path);
  }
  function attach() {
    const el = containerRef.value;
    if (el) el.addEventListener("click", handleClick);
  }
  function detach() {
    const el = containerRef.value;
    if (el) el.removeEventListener("click", handleClick);
  }
  onMounted(() => nextTick(attach));
  onUpdated(() => nextTick(() => {
    detach();
    attach();
  }));
}
export {
  useMarkdownLinks as u
};
