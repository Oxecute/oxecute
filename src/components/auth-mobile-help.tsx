"use client";

import { isLikelyInAppMobileBrowser } from "@/lib/auth/in-app-browser";
import { resetAuthCookiesAndReload } from "@/lib/auth/reset-auth-client";
import { useState } from "react";

export function AuthMobileHelp({
  afterResetPath,
}: {
  /** Where to hard-navigate after clearing cookies (e.g. `/login` or `/start`). */
  afterResetPath: string;
}) {
  const [busy, setBusy] = useState(false);
  const inApp =
    typeof window !== "undefined" && isLikelyInAppMobileBrowser();

  return (
    <div className="space-y-2 text-xs text-[var(--ca)] border border-white/10 rounded-lg p-3 mt-4">
      {inApp ? (
        <p>
          <strong className="text-[var(--fw)]">Open in Safari or Chrome</strong>{" "}
          — Google sign-in often fails inside Instagram, Facebook, TikTok, and
          other in-app browsers.
        </p>
      ) : null}
      <p>
        Stuck on this phone after Google? Old cookies can block sign-in (normal
        browser versus incognito).{" "}
        <button
          type="button"
          disabled={busy}
          className="text-[var(--ac)] underline disabled:opacity-50"
          onClick={() => {
            setBusy(true);
            void resetAuthCookiesAndReload(afterResetPath);
          }}
        >
          Clear site sign-in cookies
        </button>{" "}
        and try again.
      </p>
    </div>
  );
}
