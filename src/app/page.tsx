import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--mi)] text-[var(--fw)] flex flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6"
        style={{ color: "rgba(222, 244, 8, 0.6)" }}
      >
        EXECUTION IS THE CREDENTIAL
      </p>
      <p className="text-[17px] font-bold mb-2">
        O<span className="text-[var(--ac)]">x</span>ecute
      </p>
      <h1 className="text-[26px] font-bold max-w-lg leading-tight mb-4">
        Your record starts the moment you submit. Not when you&apos;re ready.
      </h1>
      <p className="text-[var(--ca)] max-w-md mb-8">
        You don&apos;t need 21 days in a row. Life happens. Just 21 days executed.
      </p>
      <Link
        href="/start"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--ac)] text-[var(--mi)] font-semibold px-6 py-3"
      >
        Start my record →
      </Link>
      <p className="mt-6 text-sm text-[var(--t3)]">
        No credit card. No trial. No form. One action.
      </p>
    </main>
  );
}
