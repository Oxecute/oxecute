import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#111318] text-[#EAEFF8] px-6 py-16 max-w-xl mx-auto font-sans">
      <h1 className="text-2xl font-semibold mb-4">Privacy</h1>
      <p className="text-[#5E6580] text-sm leading-relaxed mb-8">
        Oxecute treats your execution record as private by default. A full privacy policy will be
        published here. For questions, contact your Oxecute administrator.
      </p>
      <Link href="/" className="text-[#4F46E5] text-sm hover:underline">
        ← Back to home
      </Link>
    </main>
  );
}
