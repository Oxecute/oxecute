import Link from "next/link";
import { StepTracker } from "./StepTracker";
import type { OnboardingFlowPhase } from "./types";

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 mt-0.5 text-[#5E6580]"
      aria-hidden
    >
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

type SidebarProps = {
  phase: OnboardingFlowPhase;
  conexaSubtitle?: string;
};

export function CalibrationSidebar({ phase, conexaSubtitle }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-[#0D0F1A] border-r border-white/[0.06] min-h-[100dvh] px-5 py-6">
      <Link
        href="/"
        className="block w-9 h-9 shrink-0"
        aria-label="Oxecute home"
      >
        <img
          src="/brand/logo-icon.svg"
          alt=""
          width={36}
          height={36}
          className="w-9 h-9"
          decoding="async"
        />
      </Link>
      <div className="pt-8 shrink-0">
        <StepTracker phase={phase} conexaSubtitle={conexaSubtitle} />
      </div>
      <div className="flex-1 min-h-0" aria-hidden />
      <p className="text-[11px] text-[#5E6580] flex gap-2 items-start shrink-0 font-dm leading-relaxed">
        <LockIcon />
        <span>
          Your answers are private. Conexa uses them to generate your Day 0 report.
        </span>
      </p>
    </aside>
  );
}
