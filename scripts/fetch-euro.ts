import { parseCsv, rowsToObjects } from "./utils/csv";
import { fetchText } from "./utils/io";
import type { IsoDate } from "./utils/dates";

export type DailyTenorTable = {
  datesAsc: IsoDate[];
  byDate: Map<IsoDate, Map<string, number>>;
};

const ECB_TENORS: Array<{ tenor: string; seriesSuffix: string; months: number }> = [
  { tenor: "3M", seriesSuffix: "PY_3M", months: 3 },
  { tenor: "6M", seriesSuffix: "PY_6M", months: 6 },
  { tenor: "1Y", seriesSuffix: "PY_1Y", months: 12 },
  { tenor: "2Y", seriesSuffix: "PY_2Y", months: 24 },
  { tenor: "3Y", seriesSuffix: "PY_3Y", months: 36 },
  { tenor: "5Y", seriesSuffix: "PY_5Y", months: 60 },
  { tenor: "7Y", seriesSuffix: "PY_7Y", months: 84 },
  { tenor: "10Y", seriesSuffix: "PY_10Y", months: 120 },
  { tenor: "20Y", seriesSuffix: "PY_20Y", months: 240 },
  { tenor: "30Y", seriesSuffix: "PY_30Y", months: 360 }
];

export const EURO_TENORS = ECB_TENORS.map((t) => ({ tenor: t.tenor, months: t.months }));

function percentToBp(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function buildSeriesKey(seriesSuffix: string): string {
  // "All euro area ... all ratings included" (G_N_C) + par yields (PY_*)
  return `B.U2.EUR.4F.G_N_C.SV_C_YM.${seriesSuffix}`;
}

export async function fetchEuroAreaEcbParYields(params: {
  startPeriod: IsoDate;
  endPeriod: IsoDate;
  fetchTextFn?: (url: string) => Promise<string>;
}): Promise<DailyTenorTable> {
  const fetchTextFn = params.fetchTextFn ?? ((url: string) => fetchText(url));

  const byDate = new Map<IsoDate, Map<string, number>>();

  for (const tenor of ECB_TENORS) {
    const seriesKey = buildSeriesKey(tenor.seriesSuffix);
    const url = `https://data-api.ecb.europa.eu/service/data/YC/${seriesKey}?startPeriod=${params.startPeriod}&endPeriod=${params.endPeriod}&format=csvdata`;
    const csv = await fetchTextFn(url);
    const objects = rowsToObjects(parseCsv(csv));

    for (const obj of objects) {
      const time = obj["TIME_PERIOD"]?.trim();
      const obs = obj["OBS_VALUE"]?.trim();
      if (!time || !obs) continue;
      const bp = percentToBp(obs);
      if (bp === null) continue;
      const dateIso = time as IsoDate;
      if (!byDate.has(dateIso)) byDate.set(dateIso, new Map());
      byDate.get(dateIso)!.set(tenor.tenor, bp);
    }
  }

  const datesAsc = Array.from(byDate.keys()).sort();
  return { datesAsc, byDate };
}

