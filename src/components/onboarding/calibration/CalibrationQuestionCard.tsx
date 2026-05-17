export type CalibrationStepMeta = {
  tag: string;
  question: string;
  /** Guidance under the question (separate from textarea placeholder). */
  helper: string;
  placeholder: string;
  maxLen: number;
};

type CalField = "q1" | "q2" | "q3" | "q4" | "q5";

type Props = {
  index: number;
  totalSteps: number;
  meta: CalibrationStepMeta;
  field: CalField;
  value: string;
  unlocked: boolean;
  onChange: (field: CalField, value: string) => void;
};

export function CalibrationQuestionCard({
  index,
  totalSteps,
  meta,
  field,
  value,
  unlocked,
  onChange,
}: Props) {
  const num = String(index + 1).padStart(2, "0");
  const denom = String(totalSteps).padStart(2, "0");

  return (
    <div
      className={`rounded-[10px] border p-4 transition-[opacity,border-color,background-color] duration-[250ms] ease-in-out ${
        unlocked
          ? "opacity-100 border-[rgba(79,70,229,0.32)] bg-[rgba(79,70,229,0.04)]"
          : "opacity-[0.45] border-white/[0.06]"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-[0.12em] mb-1 font-dm font-semibold ${
          unlocked ? "text-[#4F46E5]" : "text-[#2E3347]"
        }`}
      >
        {unlocked ? (
          <>
            Question <span className="text-[#4F46E5]">{num}</span>
            <span className="text-[#2E3347]"> / {denom}</span>
          </>
        ) : (
          <>
            Question <span className="text-[#2E3347]">{num}</span> / {denom}
          </>
        )}
      </p>
      <p
        className={`text-[13px] font-semibold mb-1 font-urbanist leading-snug ${
          unlocked ? "text-[#EAEFF8]" : "text-[#2E3347]"
        }`}
      >
        {meta.question}
      </p>
      <p className="text-[10px] font-dm text-[#5E6580] leading-[1.5] mb-2">{meta.helper}</p>
      <textarea
        className={`w-full min-h-[100px] md:min-h-[80px] rounded-[10px] px-[14px] py-[11px] text-sm text-[#EAEFF8] font-dm outline-none transition-[border-color,box-shadow,background-color] duration-200 bg-[#1C1F2A] border border-[rgba(255,255,255,0.055)] placeholder:text-[#5E6580] focus:border-[rgba(255,255,255,0.15)] focus:bg-[#1C1F2A] focus:ring-0 ${
          unlocked ? "" : "cursor-not-allowed"
        }`}
        placeholder={meta.placeholder}
        maxLength={meta.maxLen}
        readOnly={!unlocked}
        tabIndex={unlocked ? 0 : -1}
        aria-disabled={!unlocked}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
      />
      <p className="text-[11px] font-dm text-[#2E3347] mt-1">
        {value.length}/{meta.maxLen}
        {` · use "nothing" or "none" if that's accurate`}
      </p>
    </div>
  );
}
