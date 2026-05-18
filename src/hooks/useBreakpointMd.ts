import { useSyncExternalStore } from "react";

const MD_QUERY = "(min-width: 768px)";

function subscribeMd(callback: () => void) {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMdSnapshot() {
  return window.matchMedia(MD_QUERY).matches;
}

/** `true` when viewport is Tailwind `md` (768px) and up. SSR: `false` (mobile-first). */
export function useBreakpointMd(): boolean {
  return useSyncExternalStore(subscribeMd, getMdSnapshot, () => false);
}
