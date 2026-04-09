import { parseCsv } from "./utils/csv";
import { fetchText } from "./utils/io";
import type { IsoDate } from "./utils/dates";

export type DailyTenorTable = {
  datesAsc: IsoDate[];
  byDate: Map<IsoDate, Map<string, number>>;
};

export const JAPAN_TENORS: Array<{ tenor: string; column: string; months: number }> = [
  { tenor: "1Y", column: "1Y", months: 12 },
  { tenor: "2Y", column: "2Y", months: 24 },
  { tenor: "3Y", column: "3Y", months: 36 },
  { tenor: "5Y", column: "5Y", months: 60 },
  { tenor: "7Y", column: "7Y", months: 84 },
  { tenor: "10Y", column: "10Y", months: 120 },
  { tenor: "20Y", column: "20Y", months: 240 },
  { tenor: "30Y", column: "30Y", months: 360 }
];

function parseMofDateToIso(raw: string): IsoDate {
  // MOF uses YYYY/M/D (no padding)
  const [y, m, d] = raw.split("/").map((x) => Number(x));
  if (!y || !m || !d) throw new Error(`Invalid MOF date: ${raw}`);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}` as IsoDate;
}

function percentToBp(v: string): number | null {
  const s = v.trim();
  if (!s || s === "-") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export async function fetchJapanMofJgbRates(params?: {
  fetchTextFn?: (url: string) => Promise<string>;
}): Promise<DailyTenorTable> {
  const fetchTextFn = params?.fetchTextFn ?? ((url: string) => fetchText(url));
  const url =
    "https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/historical/jgbcme_all.csv";
  const csv = await fetchTextFn(url);
  const rows = parseCsv(csv);

  // The file begins with a title row then a header row.
  const headerRowIndex = rows.findIndex((r) => r[0]?.trim() === "Date");
  if (headerRowIndex < 0) throw new Error("MOF CSV: header row not found");
  const header = rows[headerRowIndex]!.map((c) => c.trim());

  const colIndex = new Map<string, number>();
  header.forEach((h, i) => colIndex.set(h, i));

  const byDate = new Map<IsoDate, Map<string, number>>();
  for (const row of rows.slice(headerRowIndex + 1)) {
    const rawDate = (row[colIndex.get("Date") ?? -1] ?? "").trim();
    if (!rawDate) continue;
    const dateIso = parseMofDateToIso(rawDate);

    const byTenor = new Map<string, number>();
    for (const t of JAPAN_TENORS) {
      const idx = colIndex.get(t.column);
      if (idx === undefined) continue;
      const bp = percentToBp(row[idx] ?? "");
      if (bp === null) continue;
      byTenor.set(t.tenor, bp);
    }
    if (byTenor.size > 0) byDate.set(dateIso, byTenor);
  }

  const datesAsc = Array.from(byDate.keys()).sort();
  return { datesAsc, byDate };
}

