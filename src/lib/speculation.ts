const SPECULATION_TRIGGERS =
  /\b(what if|will this|will i|if i do|predict|chances|guarantee|is this going to|will investors|will users|will it work|could this)\b/i;

export function isSpeculationMessage(text: string): boolean {
  return SPECULATION_TRIGGERS.test(text);
}

export const SPECULATION_REDIRECTS = [
  "I don't predict outcomes. Your record does. Stop imagining results - start generating them. Your execution count is [N] days. What's the one action you can submit proof for today?",
  "That question is a trap. Every minute spent wondering 'will this work' is a minute you're not finding out. What's your next submission?",
  "Outcome prediction is not my function. Execution direction is. What can you do in the next 2 hours and submit proof for?",
] as const;

export function getSpeculationRedirect(executionCount: number): string {
  const pool = [...SPECULATION_REDIRECTS];
  const i =
    (executionCount + pool.length * 7) % pool.length;
  return pool[i].replace("[N]", String(executionCount));
}

const IDENTITY_FORBIDDEN = [
  "claude",
  "anthropic",
  "i am an ai",
  "as an ai",
  "language model",
  "large language model",
];

export function responseHasForbiddenIdentity(text: string): boolean {
  const l = text.toLowerCase();
  return IDENTITY_FORBIDDEN.some((w) => l.includes(w));
}
