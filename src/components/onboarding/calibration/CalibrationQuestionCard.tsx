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
          ? "opacity-100 border-[rgba(99,102,241,0.32)] bg-[rgba(99,102,241,0.04)]"
          : "opacity-[0.45] border-white/[0.06]"
      }`}
    >
      <p
        className={`text-[10px] uppercase tracking-[0.12em] mb-1 font-dm font-semibold ${
          unlocked ? "text-[#818CF8]" : "text-[#52556A]"
        }`}
      >
        {unlocked ? (
          <>
            Question <span className="text-[#818CF8]">{num}</span>
            <span className="text-[#52556A]"> / {denom}</span>
          </>
        ) : (
          <>
            Question <span className="text-[#52556A]">{num}</span> / {denom}
          </>
        )}
      </p>
      <p
        className={`text-[13px] font-semibold mb-1 font-urbanist leading-snug ${
          unlocked ? "text-[#EEEEF2]" : "text-[#52556A]"
        }`}
      >
        {meta.question}
      </p>
      <p className="text-[10px] font-dm text-[#52556A] leading-[1.5] mb-2">{meta.helper}</p>
      <textarea
        className={`w-full min-h-[100px] md:min-h-[80px] rounded-[10px] px-[14px] py-[11px] text-sm text-[#EEEEF2] font-dm outline-none transition-[border-color,box-shadow,background-color] duration-200 bg-white/[0.04] border border-white/[0.11] placeholder:text-[#52556A] focus:border-[rgba(99,102,241,0.55)] focus:bg-[rgba(99,102,241,0.06)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] ${
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
      <p className="text-[11px] font-dm text-[#52556A] mt-1">
        {value.length}/{meta.maxLen}
        {` · use "nothing" or "none" if that's accurate`}
      </p>
    </div>
  );
}
