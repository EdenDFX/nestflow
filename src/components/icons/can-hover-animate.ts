export function canHoverAnimate() {
  if (typeof window === "undefined") {
    return false;
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
