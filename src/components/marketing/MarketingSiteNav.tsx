"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Page = "landing" | "login";

/**
 * Shared top nav: wordmark or icon (never both), mid anchors, auth CTAs.
 * On `/login`, Log in is primary; on landing, Sign up is primary on large screens.
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
        window.scrollY > 30 ? "rgba(8,9,16,0.96)" : "rgba(8,9,16,0.8)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loginBtn =
    page === "login"
      ? "btn-primary max-sm:px-3 max-sm:text-[12px]"
      : "btn-ghost max-sm:px-3 max-sm:text-[12px] max-lg:uppercase max-lg:tracking-[0.12em] max-lg:text-[11px]";
  /** Below `lg`, auth and section links live in the hamburger sheet so the bar stays minimal. */
  const signupBtn =
    page === "login" ? "btn-ghost max-lg:hidden" : "btn-primary max-lg:hidden";

  return (
    <>
      <nav ref={navRef} style={{ background: "rgba(8, 9, 16, 0.8)" }}>
        <Link href="/" className="ei-logo-link" aria-label="Oxecute home">
          <img
            src="/brand/logo-wordmark.svg"
            alt=""
            className="hidden h-[38px] w-auto md:block"
            width={168}
            height={38}
            decoding="async"
          />
          <img
            src="/brand/logo-icon.svg"
            alt=""
            className="h-11 w-11 md:hidden"
            width={44}
            height={44}
            decoding="async"
          />
        </Link>
        <div className="nav-mid max-lg:hidden">
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
            aria-label={page === "landing" ? "Log in" : undefined}
          >
            {page === "landing" ? (
              <>
                <span className="max-lg:hidden">Log in</span>
                <span className="lg:hidden">Login</span>
              </>
            ) : (
              "Log in"
            )}
          </Link>
          <Link href="/start" className={signupBtn}>
            Sign up
          </Link>
          <button
            type="button"
            className="ei-nav-menu lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <span className="ei-nav-menu-bar" />
            <span className="ei-nav-menu-bar" />
            <span className="ei-nav-menu-bar" />
          </button>
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
            <a
              className="nl"
              href={`${ap}#investors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Angels
            </a>
            <a className="nl" href={`${ap}#FAQ`} onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            {page === "login" ? (
              <Link
                href="/login"
                className="btn-primary"
                style={{ marginTop: 12, display: "block", textAlign: "center" }}
                onClick={() => setMobileMenuOpen(false)}
                aria-current="page"
              >
                Log in
              </Link>
            ) : null}
            <Link
              href="/start"
              className={page === "login" ? "btn-ghost" : "btn-primary"}
              style={{ marginTop: 8, display: "block", textAlign: "center" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign up
            </Link>
            {page === "landing" ? (
              <Link
                href="/login"
                className="btn-ghost"
                style={{ marginTop: 8, display: "block", textAlign: "center" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
