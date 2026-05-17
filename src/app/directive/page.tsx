"use client";

import { AuthenticatedShell, useShellUser } from "@/components/app/AuthenticatedShell";
import { RecordPageHeader, RECORD_PAGE_SUBTITLE_CLASS } from "@/components/app/RecordPageHeader";

const titleClasses =
  "text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] text-[#EAEFF8]";
const titleFont = { fontFamily: "var(--font-urbanist), Urbanist, sans-serif" } as const;

function DirectiveContent() {
  const user = useShellUser();
  const day21 = Boolean(user.day21_reached);

  const title = (
    <h1 className={titleClasses} style={titleFont}>
      Daily Directive
    </h1>
  );

  if (day21) {
    return (
      <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-6">
        <RecordPageHeader
          title={title}
          subtitle={
            <p className={RECORD_PAGE_SUBTITLE_CLASS}>
              One move. Every day. No guessing. Conexa already knows what you&apos;re avoiding — open your
              directive from here as you execute.
            </p>
          }
        />
      </section>
    );
  }

  return (
    <section className="text-[#EAEFF8] p-5 sm:p-7 space-y-6">
      <RecordPageHeader
        title={title}
        subtitle={
          <p className={RECORD_PAGE_SUBTITLE_CLASS}>
            One move. Every day. No guessing. Activates after 21 days of execution. Conexa already knows what
            you&apos;re avoiding.
          </p>
        }
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14161f]">
        <div className="relative h-[min(58vh,520px)] w-full overflow-hidden">
          <img
            src="/brand/daily-directive-lock-preview.png"
            alt=""
            className="absolute left-1/2 top-1/2 min-h-[115%] min-w-[115%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-top blur-lg scale-100"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[#0a0c12]/45" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center px-6 py-12">
            <p className="text-center text-[15px] sm:text-base font-normal text-[#EAEFF8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Unlocks at 21 days executed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DirectivePage() {
  return (
    <AuthenticatedShell>
      <DirectiveContent />
    </AuthenticatedShell>
  );
}
