import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#111318] text-[#EAEFF8] px-6 py-16 max-w-xl mx-auto font-sans">
      <h1 className="text-2xl font-semibold mb-4">Terms</h1>
      <p className="text-[#5E6580] text-sm leading-relaxed mb-8">
        Terms of use for Oxecute will be published here. Founding cohort pricing referenced on the
        marketing site is described at signup.
      </p>
      <Link href="/" className="text-[#4F46E5] text-sm hover:underline">
        ← Back to home
      </Link>
    </main>
  );
}
