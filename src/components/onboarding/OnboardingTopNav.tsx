"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Same chrome as Execution Intelligence landing nav — for /start onboarding flow.
 * Section links point at the marketing page anchors.
 */
export function OnboardingTopNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const onStart = pathname === "/start" || pathname?.startsWith("/start/");
  const onLogin = pathname === "/login" || pathname?.startsWith("/login/");

  useEffect(() => {
    const onScroll = () => {
      const nav = navRef.current;
      if (!nav) return;
      nav.style.background =
        window.scrollY > 30 ? "rgba(8, 9, 16, 0.96)" : "rgba(8, 9, 16, 0.82)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav ref={navRef} style={{ background: "rgba(8, 9, 16, 0.82)" }}>
      <Link href="/" className="ei-logo-link" aria-label="Oxecute home">
        <img
          src="/brand/logo-icon.svg"
          alt=""
          className="h-12 w-10 object-contain max-w-10 max-h-12"
          width={40}
          height={48}
          decoding="async"
        />
      </Link>
      <div className="nav-mid flex">
        <Link className="nl" href="/#hiw">
          How it Works
        </Link>
        <Link className="nl" href="/#investors">
          Angels
        </Link>
        <Link className="nl" href="/#FAQ">
          FAQ
        </Link>
      </div>
      <div className="nav-right">
        <Link
          href="/login"
          className={onLogin ? "btn-primary" : "btn-ghost"}
          aria-current={onLogin ? "page" : undefined}
        >
          Log in
        </Link>
        <Link
          href="/start"
          className={onStart ? "btn-primary" : "btn-ghost"}
          aria-current={onStart ? "page" : undefined}
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
