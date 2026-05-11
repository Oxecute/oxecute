/** Seconds remaining until 23:59:59 UTC today (submission window close). */
export function getUtcWindowRemainingParts(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  let sec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(sec / 3600);
  sec -= hours * 3600;
  const minutes = Math.floor(sec / 60);
  const seconds = sec - minutes * 60;
  return { hours, minutes, seconds };
}

export function formatCountdown(parts: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${z(parts.hours)}:${z(parts.minutes)}:${z(parts.seconds)}`;
}
