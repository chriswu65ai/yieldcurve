export type IsoDate = `${number}-${string}-${string}`;

export function toIsoDate(date: Date): IsoDate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as IsoDate;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) throw new Error(`Invalid ISO date: ${iso}`);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysInMonthUtc(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

export function subCalendarMonth(iso: IsoDate): IsoDate {
  const date = parseIsoDate(iso);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  let newY = y;
  let newM = m - 1;
  if (newM <= 0) {
    newM += 12;
    newY -= 1;
  }

  const dim = daysInMonthUtc(newY, newM);
  const newD = Math.min(d, dim);
  return toIsoDate(new Date(Date.UTC(newY, newM - 1, newD)));
}

export function subCalendarYear(iso: IsoDate): IsoDate {
  const date = parseIsoDate(iso);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  const newY = y - 1;
  const dim = daysInMonthUtc(newY, m);
  const newD = Math.min(d, dim);
  return toIsoDate(new Date(Date.UTC(newY, m - 1, newD)));
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function pickNearestOnOrBefore(
  availableDatesSortedAsc: IsoDate[],
  target: IsoDate
): IsoDate {
  if (availableDatesSortedAsc.length === 0) {
    throw new Error("No available dates");
  }

  // Rightmost date <= target
  let lo = 0;
  let hi = availableDatesSortedAsc.length - 1;
  let bestIdx = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = availableDatesSortedAsc[mid]!;
    if (value <= target) {
      bestIdx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (bestIdx >= 0) return availableDatesSortedAsc[bestIdx]!;
  // If target is before our earliest date, fall back to earliest.
  return availableDatesSortedAsc[0]!;
}

