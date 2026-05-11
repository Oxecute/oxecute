/** Authenticated sidebar - brief + lock labels */
export type NavItem = {
  label: string;
  href: string;
  lockLabel?: string;
  teamOnly?: boolean;
};

export const DASHBOARD_NAV_REST: NavItem[] = [
  { label: "FOR", href: "/dashboard" },
  { label: "Signal Score", href: "/signal", lockLabel: "21 days executed" },
  { label: "Daily Directive", href: "/directive", lockLabel: "21 days executed" },
  { label: "Coaches", href: "/coaches", lockLabel: "Coming Soon" },
  { label: "Angels", href: "/angels", lockLabel: "Coming Soon" },
  { label: "Community", href: "/community", lockLabel: "45 days executed" },
  { label: "Inbox", href: "/inbox" },
  { label: "Request Feature", href: "/board" },
  { label: "Connect Tools", href: "/tools" },
];
