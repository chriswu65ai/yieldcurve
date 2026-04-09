export function formatUtcTimestampForDisplay(utcIso: string): string {
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return utcIso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatBp(yieldBp: number | null | undefined): string {
  if (yieldBp === null || yieldBp === undefined) return "—";
  return `${yieldBp} bp`;
}

