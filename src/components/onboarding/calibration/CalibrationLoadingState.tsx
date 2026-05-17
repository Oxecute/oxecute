export function CalibrationLoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 md:py-24 px-6 text-center min-h-[min(100%,420px)]">
      <div
        className="h-10 w-10 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin mb-5"
        aria-hidden
      />
      <p
        className="text-base font-bold text-[#EEEEF2] font-urbanist tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif", fontSize: "16px" }}
      >
        Conexa is reading your pattern...
      </p>
      <p className="text-[13px] font-dm text-[#9194AB] mt-2 max-w-sm leading-relaxed">
        Calibrating your Day 0 intelligence report
      </p>
    </div>
  );
}
