import type { OnboardingFlowPhase } from "./types";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
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

type Props = {
  phase: OnboardingFlowPhase;
  /** Shown under “Conexa” when that section is active (steps 4–8). */
  conexaSubtitle?: string;
};

export function StepTracker({ phase, conexaSubtitle }: Props) {
  const startupComplete = phase === "conexa";
  const startupActive = phase === "startup";
  const conexaActive = phase === "conexa";
  const signupPhase = phase === "signup";

  const row2Sub =
    conexaActive && conexaSubtitle
      ? conexaSubtitle
      : signupPhase
        ? "After your startup"
        : startupActive
          ? "Five honest answers · then your read"
          : "Calibration through first entry";

  return (
    <div className="relative pl-0">
      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center w-[18px] shrink-0">
          {startupComplete ? (
            <span
              className="flex h-[14px] w-[14px] items-center justify-center text-[#10B981]"
              aria-hidden
            >
              <CheckIcon className="shrink-0" />
            </span>
          ) : startupActive ? (
            <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5] ring-4 ring-[#4F46E5]/20" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-[#5E6580]" />
          )}
          <div className="w-px flex-1 min-h-[28px] bg-white/[0.08]" />
        </div>
        <div className="pb-6">
          <p
            className={`text-[13px] font-semibold leading-tight font-urbanist ${
              startupActive
                ? "text-[#EAEFF8]"
                : startupComplete
                  ? "text-[#9194AB]"
                  : "text-[#5E6580]"
            }`}
          >
            Your Startup
          </p>
          <p className="text-[11px] font-dm text-[#5E6580] mt-0.5">
            {signupPhase
              ? "You’ll do this right after sign-up"
              : startupComplete
                ? "Complete"
                : "What you’re building"}
          </p>
        </div>
      </div>
      <div className="flex gap-3 items-start -mt-1">
        <div className="flex flex-col items-center w-[18px] shrink-0">
          {conexaActive ? (
            <span className="h-2.5 w-2.5 rounded-full bg-[#4F46E5] ring-4 ring-[#4F46E5]/20" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-[#5E6580]" />
          )}
        </div>
        <div>
          <p
            className={`text-[13px] font-semibold leading-tight font-urbanist ${
              conexaActive ? "text-[#EAEFF8]" : "text-[#5E6580]"
            }`}
          >
            Conexa
          </p>
          <p className="text-[11px] font-dm text-[#5E6580] mt-0.5">{row2Sub}</p>
        </div>
      </div>
    </div>
  );
}
