/**
 * Embedded WebViews (Instagram, Facebook, etc.) often break OAuth cookies / storage.
 * Prompt users to open the app in Safari or Chrome instead.
 */
export function isLikelyInAppMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Instagram|FBAN|FBAV|FB_IAB|Line\/|LinkedInApp|Snapchat|TikTok/i.test(
    ua,
  );
}
