/** Static Conexa lines after entry submit - no API call (brief §9). */
export function getAcknowledgment(
  tier: string,
  category: string,
): string {
  const c = category.toLowerCase();
  const lines = [
    `Logged. ${c} work is now on the record.`,
    `Entry locked. Conexa will read this in context.`,
    `Immutable. Your operating record just moved.`,
    `Proof captured under ${c}.`,
    "That submission is permanent. Build from it tomorrow.",
    "Recorded. The gap between intent and proof just narrowed.",
    "Logged for the ledger. No edits. No take-backs.",
    "Your record reflects what you shipped today - in this category.",
  ];
  let h = 0;
  for (let i = 0; i < tier.length; i++) h = (h + tier.charCodeAt(i) * (i + 1)) % lines.length;
  for (let i = 0; i < c.length; i++) h = (h + c.charCodeAt(i)) % lines.length;
  return lines[h];
}
