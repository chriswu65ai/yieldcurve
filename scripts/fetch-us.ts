import { parseCsv, rowsToObjects } from "./utils/csv";
import { fetchText } from "./utils/io";
import type { IsoDate } from "./utils/dates";

export type DailyTenorTable = {
  datesAsc: IsoDate[];
  byDate: Map<IsoDate, Map<string, number>>;
};

const TREASURY_TENOR_COLUMNS: Array<{ tenor: string; column: string; months: number }> = [
  { tenor: "1M", column: "1 Mo", months: 1 },
  { tenor: "3M", column: "3 Mo", months: 3 },
  { tenor: "6M", column: "6 Mo", months: 6 },
  { tenor: "1Y", column: "1 Yr", months: 12 },
  { tenor: "2Y", column: "2 Yr", months: 24 },
  { tenor: "3Y", column: "3 Yr", months: 36 },
  { tenor: "5Y", column: "5 Yr", months: 60 },
  { tenor: "7Y", column: "7 Yr", months: 84 },
  { tenor: "10Y", column: "10 Yr", months: 120 },
  { tenor: "20Y", column: "20 Yr", months: 240 },
  { tenor: "30Y", column: "30 Yr", months: 360 }
];

function parseTreasuryDateToIso(mmddyyyy: string): IsoDate {
  const [mm, dd, yyyy] = mmddyyyy.split("/").map((x) => Number(x));
  if (!mm || !dd || !yyyy) throw new Error(`Invalid Treasury date: ${mmddyyyy}`);
  const m = String(mm).padStart(2, "0");
  const d = String(dd).padStart(2, "0");
  return `${yyyy}-${m}-${d}` as IsoDate;
}

function percentToBp(percentStr: string): number | null {
  const v = percentStr.trim();
  if (!v || v === "N/A") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export async function fetchUsTreasuryParYields(params?: {
  now?: Date;
  fetchTextFn?: (url: string) => Promise<string>;
}): Promise<DailyTenorTable> {
  const now = params?.now ?? new Date();
  const fetchTextFn = params?.fetchTextFn ?? ((url: string) => fetchText(url));
  const year = now.getUTCFullYear();
  const years = [year - 1, year];

  const allObjects: Array<Record<string, string>> = [];
  for (const y of years) {
    const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${y}/all?type=daily_treasury_yield_curve&_format=csv`;
    const csv = await fetchTextFn(url);
    const rows = parseCsv(csv);
    allObjects.push(...rowsToObjects(rows));
  }

  const byDate = new Map<IsoDate, Map<string, number>>();
  for (const obj of allObjects) {
    const rawDate = obj["Date"];
    if (!rawDate) continue;
    const dateIso = parseTreasuryDateToIso(rawDate);

    const byTenor = new Map<string, number>();
    for (const t of TREASURY_TENOR_COLUMNS) {
      const bp = percentToBp(obj[t.column] ?? "");
      if (bp === null) continue;
      byTenor.set(t.tenor, bp);
    }
    if (byTenor.size === 0) continue;
    byDate.set(dateIso, byTenor);
  }

  const datesAsc = Array.from(byDate.keys()).sort();
  return { datesAsc, byDate };
}

export const US_TENORS = TREASURY_TENOR_COLUMNS.map((t) => ({
  tenor: t.tenor,
  months: t.months
}));

