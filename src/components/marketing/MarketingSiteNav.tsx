"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Page = "landing" | "login";

/**
 * Shared top nav: brand icon, mid anchors, auth CTAs.
 * Section links stay in the bar on small screens (no duplicate hamburger sheet).
 */
export function MarketingSiteNav({ page }: { page: Page }) {
  const navRef = useRef<HTMLElement | null>(null);
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

  const loginBtn =
    page === "login"
      ? "btn-primary max-sm:px-3 max-sm:text-[12px]"
      : "btn-ghost max-sm:px-3 max-sm:text-[12px]";
  const signupBtn =
    page === "login"
      ? "btn-ghost max-sm:px-3 max-sm:text-[12px]"
      : "btn-primary max-sm:px-3 max-sm:text-[12px]";

  return (
    <nav ref={navRef} style={{ background: "rgba(24, 27, 36, 0.88)" }}>
      <Link href="/" className="ei-logo-link" aria-label="Oxecute home">
        <img
          src="/brand/logo-icon.svg"
          alt=""
          className="h-10 w-10 md:h-11 md:w-11"
          width={44}
          height={44}
          decoding="async"
        />
      </Link>
      <div className="nav-mid">
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
  );
}
