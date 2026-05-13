/** Authenticated sidebar - brief + lock labels */
export type NavItem = {
  label: string;
  href: string;
  lockLabel?: string;
  teamOnly?: boolean;
};

export const NAV_PROFILE_ITEMS: NavItem[] = [
  { label: "My Profile", href: "/settings/profile" },
];

export const NAV_DASHBOARD_ITEMS: NavItem[] = [
  { label: "FOR", href: "/dashboard" },
  { label: "Signal Score", href: "/signal", lockLabel: "Day 21" },
  { label: "Daily Directive", href: "/directive", lockLabel: "Day 21" },
];

export const NAV_PAGE_ITEMS: NavItem[] = [
  { label: "Coaches", href: "/coaches", lockLabel: "Day 60" },
  { label: "Angels", href: "/angels", lockLabel: "Day 60" },
  { label: "Community", href: "/community", lockLabel: "Day 45" },
  { label: "Inbox", href: "/inbox" },
];

export const NAV_TOOL_ITEMS: NavItem[] = [
  { label: "Request Feature", href: "/board" },
  { label: "Connect Tools", href: "/tools" },
];

/** @deprecated use NAV_*_ITEMS */
export const DASHBOARD_NAV_REST: NavItem[] = [
  ...NAV_DASHBOARD_ITEMS,
  ...NAV_PAGE_ITEMS,
  ...NAV_TOOL_ITEMS,
];
