"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Page = "landing" | "login";

/**
 * Shared top nav: logo + hamburger (small screens, left), section links (lg+ only), auth on the right.
 * Section anchors exist only in the sheet below lg — not duplicated in the bar.
 */
export function MarketingSiteNav({ page }: { page: Page }) {
  const navRef = useRef<HTMLElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ap = page === "login" ? "/" : "";

  useEffect(() => {
    const onScroll = () => {
      const nav = navRef.current;
      if (!nav) return;
      nav.style.background =
        window.scrollY > 30 ? "rgba(24,27,36,0.96)" : "rgba(24,27,36,0.88)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const loginBtn =
    page === "login"
      ? "btn-primary max-sm:px-3 max-sm:text-[12px]"
      : "btn-ghost max-sm:px-3 max-sm:text-[12px]";
  const signupBtn =
    page === "login"
      ? "btn-ghost max-sm:px-3 max-sm:text-[12px]"
      : "btn-primary max-sm:px-3 max-sm:text-[12px]";

  return (
    <>
      <nav ref={navRef} style={{ background: "rgba(24, 27, 36, 0.88)" }}>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="ei-logo-link" aria-label="Oxecute home">
            <img
              src="/brand/logo-icon.svg"
              alt=""
              className="h-12 w-10 object-contain"
              width={40}
              height={48}
              decoding="async"
            />
          </Link>
          <button
            type="button"
            className="ei-nav-menu flex lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <span className="ei-nav-menu-bar" />
            <span className="ei-nav-menu-bar" />
            <span className="ei-nav-menu-bar" />
          </button>
        </div>

        <div className="nav-mid hidden lg:flex">
          <a className="nl" href={`${ap}#hiw`}>
            How it works
          </a>
          <a className="nl" href={`${ap}#investors`}>
            Angels
          </a>
          <a className="nl" href={`${ap}#FAQ`}>
            FAQ
          </a>
        </div>

        <div className="nav-right">
          <Link
            href="/login"
            className={loginBtn}
            aria-current={page === "login" ? "page" : undefined}
          >
            Log in
          </Link>
          <Link href="/start" className={signupBtn}>
            Sign up
          </Link>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div
          className="ei-mobile-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <button
            type="button"
            className="ei-mobile-sheet-close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="ei-mobile-sheet-inner">
            <a className="nl" href={`${ap}#hiw`} onClick={() => setMobileMenuOpen(false)}>
              How it works
            </a>
            <a className="nl" href={`${ap}#investors`} onClick={() => setMobileMenuOpen(false)}>
              Angels
            </a>
            <a className="nl" href={`${ap}#FAQ`} onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            {page === "login" ? (
              <>
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{ marginTop: 12, display: "block", textAlign: "center" }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current="page"
                >
                  Log in
                </Link>
                <Link
                  href="/start"
                  className="btn-ghost"
                  style={{ marginTop: 8, display: "block", textAlign: "center" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
