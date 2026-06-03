/** Teal “Coming soon” pill — Network header + Connect Tools (fixed size; no text-sm inheritance). */
export const COMING_SOON_PILL_CLASS =
  "inline-flex h-4 min-h-4 items-center gap-0.5 rounded-full border border-[rgba(14,164,114,0.45)] px-1 py-0 !text-[7px] !leading-none font-semibold uppercase tracking-[0.06em] text-[#a7f3d0] bg-[rgba(14,164,114,0.12)] shrink-0 whitespace-nowrap box-border";

/** Authenticated sidebar - brief + lock labels */
export type NavItem = {
  label: string;
  href: string;
  lockLabel?: string;
  teamOnly?: boolean;
  /** Row is non-interactive (e.g. Network — not live). */
  disabled?: boolean;
};

export const NAV_OVERVIEW_ITEMS: NavItem[] = [
  { label: "Operating Record", href: "/dashboard" },
  { label: "Signal Score", href: "/signal", lockLabel: "Day 21" },
  { label: "Daily Directive", href: "/directive", lockLabel: "Day 21" },
  { label: "Inbox", href: "/inbox" },
];

/** Not live — shown grey, no hover; no navigation. */
export const NAV_NETWORK_ITEMS: NavItem[] = [
  { label: "Coaches", href: "/coaches" },
  { label: "Angels", href: "/angels" },
  { label: "Community", href: "/community" },
];

export const NAV_TOOL_ITEMS: NavItem[] = [
  { label: "Connect\u00a0Tools", href: "/tools" },
  { label: "Request Feature", href: "/board" },
];

/** @deprecated */
export const NAV_PROFILE_ITEMS: NavItem[] = [];

/** @deprecated */
export const NAV_DASHBOARD_ITEMS = NAV_OVERVIEW_ITEMS;

/** @deprecated */
export const NAV_PAGE_ITEMS = NAV_NETWORK_ITEMS;

/** @deprecated use NAV_OVERVIEW_ITEMS */
export const DASHBOARD_NAV_REST: NavItem[] = [
  ...NAV_OVERVIEW_ITEMS,
  ...NAV_NETWORK_ITEMS,
  ...NAV_TOOL_ITEMS,
];
