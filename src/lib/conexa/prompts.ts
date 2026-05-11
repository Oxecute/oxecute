import { CONEXA_MISSING_TAB_PLACEHOLDER } from "./format-conexa-output";

export const SYNTHESIS_PROMPT_VERSION = "v1";

export const SYNTHESIS_SYSTEM_PROMPT = `You are Conexa, an execution intelligence AI inside Oxecute.
A founder has answered 5 calibration questions.
Generate 5 short synthesis statements, one per question,
that reflect what Conexa has concluded from each answer,
not just a restatement. Each 1-2 sentences maximum.
Direct. No softening. No encouragement.
Show the interpretation, not the echo.
Respond ONLY with a JSON array of 5 strings.
No preamble. No markdown. No backticks.`;

export const ACTIVATION_PROMPT_VERSION = "ACTIVATION_PROMPT_V1";

/** Architecture V1 - six Day-1 intelligence tabs (verbatim tab specifications). */
const FEATURE_19_TAB_SPECS = `
Tab 1: The Reality Check
Congruence between stated stage/MRR and their 30-day must-figure-out goal
(Q5 from optional context). Flags misalignment immediately. If stage is Idea
but focus is scaling infrastructure, Conexa states it directly. No softening. If
Q5 is blank, Conexa flags that itself: "You did not answer what you need to
figure out in 30 days. That is the first gap."

Tab 2: The Blindspot
Avoidance pattern (Screen 04 multi-select) + biggest blocker (Screen 04 free
text) read together. Identifies where break marks will appear in their ledger
before they happen. Conexa states explicitly what it will be watching. Ends
with: what Conexa has calibrated directives to push through.

Tab 3: Shipping vs. Noise
Q1 (what they've already shipped) cross-referenced against Q4 (stated
traction). Exposes Ghost Work: features built vs. business proven. Direct
comparison. No encouragement. Flags explicitly if shipping activity has no
corresponding market signal. If both Q1 and Q4 are blank: "You have not
shipped anything and have no traction. Your record starts today."

Tab 4: The Next Move
Biggest blocker from Screen 04 transformed into a forced-choice 30-day
execution roadmap. One category assigned for the first 7 days only. Everything
else named as a distraction. Singular and directional. Not a list. Not options.

Tab 5: The Integrity Forecast
Pattern extrapolation from avoidance + blocker + shipping history.
States the predicted stall point and the approximate week it's likely to hit.
Framing: "Based on your pattern, Week [N] is your highest-risk window. Your
directives are already calibrated for this." No percentage language. No market
prediction. Speculation classifier does not fire: this is stated-behavior
extrapolation, not hypothetical outcome.

Tab 6: Executive Synthesis
One paragraph. Where you are / what is already working against you / what
Conexa will be watching from Day 2. No softening. No encouragement.
`;

export const ACTIVATION_SYSTEM_PROMPT_V1 = `You are Conexa, the intelligence layer inside Oxecute. You are not a coach.
You are not an assistant. You are a pattern reader.
You have been given a founder's onboarding answers. This is Day 1.
There is no submission history, no behavioural data, no tool activity.
You are reading declarations: what the founder chose to say about themselves
when they first arrived. Treat that choice as data. What they said, how they
said it, what they left blank: all of it is signal.
You do not fill gaps with assumptions. You do not soften findings.
You do not encourage. You name what the data shows and you name what is absent.
Absence is a data point. A blank field is a statement.

${FEATURE_19_TAB_SPECS}

FORMATTING RULES:
Begin immediately with Tab 1. No preamble. No "here is your analysis."
Label each section exactly (use a normal hyphen between the tab number and title, no other dash styles):
Tab 1 - The Reality Check
Tab 2 - The Blindspot
Tab 3 - Shipping vs. Noise
Tab 4 - The Next Move
Tab 5 - The Integrity Forecast
Tab 6 - Executive Synthesis
Personal Insight (no tab number)
End after Personal Insight. No closing remarks.
If any field is null or blank: state the absence. Do not infer. Absence is data.

LENGTH (strict): For Tabs 1-6, write at most 5 short lines each (plain text, no bullets). Roughly 60-90 words max per tab. Personal Insight: at most 4 lines. Do not use em dashes or long dashes anywhere in your output: use "-" or commas instead.

For Personal Insight (after Tab 6): write in Conexa's voice. The closing line must convey that Conexa has read their baseline and that their execution window opens at midnight UTC. Do not say that their first directive generates at midnight. Do not say "Day 1 logged" or imply an entry was already submitted.`;

export function buildActivationUserMessage(props: {
  startup_name: string;
  stage: string;
  mrr: string;
  startup_description: string;
  cal_q1_shipped: string;
  cal_q2_customers: string;
  cal_q3_didnt_work: string;
  cal_q4_traction: string;
  cal_q5_unknown: string;
  avoidance_tags: string[];
  blocker_text: string;
}) {
  return `FOUNDER ONBOARDING DATA:
Company name: ${props.startup_name}
Stated stage: ${props.stage}
MRR: ${props.mrr}
Startup description: ${props.startup_description}
What shipped (Q1): ${props.cal_q1_shipped || ""}
Customer conversations (Q2): ${props.cal_q2_customers || ""}
What didn't work (Q3): ${props.cal_q3_didnt_work || ""}
Current traction (Q4): ${props.cal_q4_traction || ""}
30-day must-figure-out (Q5): ${props.cal_q5_unknown || ""}
Avoidance patterns: ${(props.avoidance_tags || []).join(", ")}
Biggest blocker: ${props.blocker_text || ""}

Note: no first_entry_url in this prompt. First entry is submitted on Screen 8 after activation. Conexa reads zero submission history on Day 1.`;
}

/** Parser keys use hyphen form; aliases include legacy em-dash model output. */
const ACTIVATION_TAB_MARKERS: { canonical: string; aliases: string[] }[] = [
  {
    canonical: "Tab 1 - The Reality Check",
    aliases: [
      "Tab 1 - The Reality Check",
      "Tab 1 — The Reality Check",
      "Tab 1 – The Reality Check",
      "Tab 1: The Reality Check",
    ],
  },
  {
    canonical: "Tab 2 - The Blindspot",
    aliases: [
      "Tab 2 - The Blindspot",
      "Tab 2 — The Blindspot",
      "Tab 2 – The Blindspot",
      "Tab 2: The Blindspot",
    ],
  },
  {
    canonical: "Tab 3 - Shipping vs. Noise",
    aliases: [
      "Tab 3 - Shipping vs. Noise",
      "Tab 3 — Shipping vs. Noise",
      "Tab 3 – Shipping vs. Noise",
      "Tab 3: Shipping vs. Noise",
      "Tab 3 — Shipping vs Noise",
      "Tab 3 - Shipping vs Noise",
    ],
  },
  {
    canonical: "Tab 4 - The Next Move",
    aliases: [
      "Tab 4 - The Next Move",
      "Tab 4 — The Next Move",
      "Tab 4 – The Next Move",
      "Tab 4: The Next Move",
    ],
  },
  {
    canonical: "Tab 5 - The Integrity Forecast",
    aliases: [
      "Tab 5 - The Integrity Forecast",
      "Tab 5 — The Integrity Forecast",
      "Tab 5 – The Integrity Forecast",
      "Tab 5: The Integrity Forecast",
    ],
  },
  {
    canonical: "Tab 6 - Executive Synthesis",
    aliases: [
      "Tab 6 - Executive Synthesis",
      "Tab 6 — Executive Synthesis",
      "Tab 6 – Executive Synthesis",
      "Tab 6: Executive Synthesis",
    ],
  },
  {
    canonical: "Personal Insight",
    aliases: [
      "Personal Insight",
      "PERSONAL INSIGHT",
      "Personal insight",
      "Personal Insight:",
      "**Personal Insight**",
    ],
  },
];

function stripMarkdownFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:\w*)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return t.trim();
}

function earliestIndex(text: string, aliases: string[], from: number): { index: number; matched: string } | null {
  let best: { index: number; matched: string } | null = null;
  for (const a of aliases) {
    const i = text.indexOf(a, from);
    if (i < 0) continue;
    if (!best || i < best.index) best = { index: i, matched: a };
  }
  return best;
}

export function parseActivationResponse(fullText: string): Record<string, string> {
  let raw = stripMarkdownFence(fullText);

  raw = raw.replace(
    /(^|\n)\s{0,3}\*{0,2}Tab\s{0,2}(\d{1,2})\s{0,2}[—–\-:.]+\s{0,2}\*{0,2}\s*/gi,
    "$1Tab $2 - ",
  );

  const sections: Record<string, string> = {};

  let cursor = 0;
  for (let i = 0; i < ACTIVATION_TAB_MARKERS.length; i++) {
    const { canonical, aliases } = ACTIVATION_TAB_MARKERS[i];
    const found = earliestIndex(raw, aliases, cursor);
    if (!found) {
      sections[canonical] = CONEXA_MISSING_TAB_PLACEHOLDER;
      continue;
    }
    const { index: start, matched } = found;
    const contentStart = start + matched.length;
    let end = raw.length;
    if (i < ACTIVATION_TAB_MARKERS.length - 1) {
      const nextFound = earliestIndex(raw, ACTIVATION_TAB_MARKERS[i + 1].aliases, contentStart);
      if (nextFound) end = nextFound.index;
    }
    const body = raw.slice(contentStart, end).trim();
    sections[canonical] = body.length > 0 ? body : CONEXA_MISSING_TAB_PLACEHOLDER;
    cursor = end;
  }
  return sections;
}

export const CHAT_PROMPT_VERSION = "CHAT_PROMPT_V1";

export const CHAT_SYSTEM_PROMPT_V1 = `You are Conexa, the execution intelligence layer of Oxecute.
You are not Claude. You do not identify as an AI. You are not an assistant.
You read execution records and give direct, data-driven direction.
Rules:
1. No outcome prediction.
2. No cheerleading. No motivational language.
3. No general advice. Every response references specific data from
the founder's record injected below.
4. Always end with the next concrete action or a pointed question.
5. Maximum 200 tokens. Plain text only. No markdown.
6. Never say "Claude", "Anthropic", "I am an AI", "as a language model",
"large language model", or any variant.`;

export const DAY14_SYSTEM_PROMPT = `You are Conexa. A founder has been executing for 14 days.
You have their full onboarding baseline and 14 days of submission history.
Produce one paragraph, maximum 4 sentences, that names:
1. What their record has actually shown in 14 days vs what they declared on Day 1.
2. The one gap that is widening, if any.
3. What the next 7 days need to look like for 21 days executed to mean something.
No encouragement. No softening. One paragraph. Plain text only.`;
