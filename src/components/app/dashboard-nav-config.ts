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
  { label: "Conexa", href: "/conexa" },
  { label: "Daily Directive", href: "/directive", lockLabel: "Day 21" },
  { label: "Inbox", href: "/inbox" },
];

/** Not live — shown grey, no hover; no navigation. */
export const NAV_NETWORK_ITEMS: NavItem[] = [
  { label: "Coaches", href: "/coaches", disabled: true },
  { label: "Angels", href: "/angels", disabled: true },
  { label: "Community", href: "/community", disabled: true },
];

export const NAV_TOOL_ITEMS: NavItem[] = [
  { label: "Connect Tools", href: "/tools" },
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
