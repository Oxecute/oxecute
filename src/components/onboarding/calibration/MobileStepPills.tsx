import type { OnboardingFlowPhase } from "./types";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = { phase: OnboardingFlowPhase };

export function MobileStepPills({ phase }: Props) {
  const startupDone = phase === "conexa";
  const startupActive = phase === "startup";
  const conexaActive = phase === "conexa";
  const signupPhase = phase === "signup";

  return (
    <div className="md:hidden flex gap-2 px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
      <div
        className={`flex-1 rounded-full border px-3 py-2 text-center text-[11px] font-dm transition-colors ${
          signupPhase
            ? "border-white/10 text-[#52556A]"
            : startupActive
              ? "border-[#6366F1]/40 bg-[#6366F1]/10 text-[#EEEEF2]"
              : startupDone
                ? "border-white/10 bg-transparent text-[#9194AB]"
                : "border-white/10 text-[#52556A]"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 justify-center w-full">
          {startupDone ? (
            <>
              <CheckIcon className="text-[#10B981] shrink-0" />
              Your Startup
            </>
          ) : (
            "Your Startup"
          )}
        </span>
      </div>
      <div
        className={`flex-1 rounded-full border px-3 py-2 text-center text-[11px] font-dm transition-colors ${
          conexaActive
            ? "border-[#6366F1]/40 bg-[#6366F1]/10 text-[#EEEEF2]"
            : "border-white/10 text-[#52556A]"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 justify-center w-full">
          {conexaActive ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] shrink-0" />
              Conexa
            </>
          ) : (
            "Conexa"
          )}
        </span>
      </div>
    </div>
  );
}
