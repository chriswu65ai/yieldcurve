import path from "node:path";
import type { MarketData, Metadata, RefreshStatus, Snapshot } from "../shared/types";
import { assertAndNormalizeMarketData } from "./normalize";
import { fetchUsTreasuryParYields, US_TENORS } from "./fetch-us";
import { fetchJapanMofJgbRates, JAPAN_TENORS } from "./fetch-japan";
import { fetchEuroAreaEcbParYields, EURO_TENORS } from "./fetch-euro";
import {
  addDays,
  pickNearestOnOrBefore,
  subCalendarMonth,
  subCalendarYear,
  toIsoDate,
  type IsoDate
} from "./utils/dates";
import { readJsonIfExists, writeJsonAtomic } from "./utils/io";

type MarketBuildResult = { status: RefreshStatus; marketData: MarketData | null; error?: string };

const SITE_VERSION = "1.0.0";

function buildSnapshotsFromTable(params: {
  market: MarketData["market"];
  title: string;
  source: MarketData["source"];
  tenors: Array<{ tenor: string; months: number }>;
  table: { datesAsc: IsoDate[]; byDate: Map<IsoDate, Map<string, number>> };
}): MarketData {
  const latest = params.table.datesAsc[params.table.datesAsc.length - 1];
  if (!latest) throw new Error("No data available");

  const targets: Array<{ label: Snapshot["label"]; targetDate: IsoDate }> = [
    { label: "Current", targetDate: latest },
    { label: "1 week ago", targetDate: addDays(latest, -7) },
    { label: "1 month ago", targetDate: subCalendarMonth(latest) },
    { label: "1 year ago", targetDate: subCalendarYear(latest) }
  ];

  const availableDatesAsc = params.table.datesAsc;
  const snapshots: Snapshot[] = targets.map((t) => {
    const actual = t.label === "Current" ? latest : pickNearestOnOrBefore(availableDatesAsc, t.targetDate);
    const row = params.table.byDate.get(actual);
    const points = params.tenors
      .map((tenor) => {
        const yieldBp = row?.get(tenor.tenor);
        if (yieldBp === undefined) return null;
        return { tenor: tenor.tenor, months: tenor.months, yieldBp };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      label: t.label,
      targetDate: t.targetDate,
      actualDate: actual,
      points
    };
  });

  return assertAndNormalizeMarketData({
    market: params.market,
    title: params.title,
    source: params.source,
    snapshots
  });
}

async function buildMarketUs(
  now: Date,
  fetchTextFn?: (url: string) => Promise<string>
): Promise<MarketBuildResult> {
  try {
    const table = await fetchUsTreasuryParYields({
      now,
      ...(fetchTextFn ? { fetchTextFn } : {})
    });
    const marketData = buildSnapshotsFromTable({
      market: "us",
      title: "United States Treasury Curve",
      source: {
        name: "U.S. Treasury Daily Treasury Par Yield Curve Rates",
        type: "official_par_yield",
        methodologyLabel: "Official par yield curve"
      },
      tenors: US_TENORS,
      table
    });
    return { status: "ok", marketData };
  } catch (err: any) {
    return { status: "stale", marketData: null, error: String(err?.message ?? err) };
  }
}

async function buildMarketJapan(fetchTextFn?: (url: string) => Promise<string>): Promise<MarketBuildResult> {
  try {
    const table = await fetchJapanMofJgbRates(fetchTextFn ? { fetchTextFn } : undefined);
    const marketData = buildSnapshotsFromTable({
      market: "japan",
      title: "Japan Government Bond Curve",
      source: {
        name: "Ministry of Finance Japan JGB Interest Rate",
        type: "official_fixed_tenor",
        methodologyLabel: "Official fixed-tenor MOF series"
      },
      tenors: JAPAN_TENORS.map((t) => ({ tenor: t.tenor, months: t.months })),
      table
    });
    return { status: "ok", marketData };
  } catch (err: any) {
    return { status: "stale", marketData: null, error: String(err?.message ?? err) };
  }
}

async function buildMarketEuro(
  now: Date,
  fetchTextFn?: (url: string) => Promise<string>
): Promise<MarketBuildResult> {
  try {
    const end = toIsoDate(now);
    const start = addDays(end, -400);
    const table = await fetchEuroAreaEcbParYields({
      startPeriod: start,
      endPeriod: end,
      ...(fetchTextFn ? { fetchTextFn } : {})
    });
    const marketData = buildSnapshotsFromTable({
      market: "euro",
      title: "Euro Area Government Par Curve",
      source: {
        name: "ECB euro-area yield curve dataset",
        type: "official_model_par_yield_all_ratings",
        methodologyLabel: "Official model-derived par curve, all ratings included"
      },
      tenors: EURO_TENORS,
      table
    });
    return { status: "ok", marketData };
  } catch (err: any) {
    return { status: "stale", marketData: null, error: String(err?.message ?? err) };
  }
}

export async function runDataUpdate(params?: {
  repoRoot?: string;
  now?: Date;
  fetchTextFn?: (url: string) => Promise<string>;
}) {
  const repoRoot = params?.repoRoot ?? process.cwd();
  const now = params?.now ?? new Date();
  const fetchTextFn = params?.fetchTextFn;

  const dataDir = path.join(repoRoot, "public", "data");

  const prevUs = await readJsonIfExists<MarketData>(path.join(dataDir, "us.json"));
  const prevEuro = await readJsonIfExists<MarketData>(path.join(dataDir, "euro.json"));
  const prevJapan = await readJsonIfExists<MarketData>(path.join(dataDir, "japan.json"));

  const [us, euro, japan] = await Promise.all([
    buildMarketUs(now, fetchTextFn),
    buildMarketEuro(now, fetchTextFn),
    buildMarketJapan(fetchTextFn)
  ]);

  let okCount = 0;
  for (const r of [us, euro, japan]) if (r.status === "ok") okCount++;

  const refreshStatus: Metadata["refreshStatus"] = {
    us: us.status,
    euro: euro.status,
    japan: japan.status
  };

  const metadata: Metadata = {
    generatedAtUtc: new Date().toISOString(),
    siteVersion: SITE_VERSION,
    markets: ["us", "euro", "japan"],
    refreshStatus
  };

  if (us.marketData) await writeJsonAtomic(path.join(dataDir, "us.json"), us.marketData);
  else if (prevUs) await writeJsonAtomic(path.join(dataDir, "us.json"), prevUs);

  if (euro.marketData) await writeJsonAtomic(path.join(dataDir, "euro.json"), euro.marketData);
  else if (prevEuro) await writeJsonAtomic(path.join(dataDir, "euro.json"), prevEuro);

  if (japan.marketData) await writeJsonAtomic(path.join(dataDir, "japan.json"), japan.marketData);
  else if (prevJapan) await writeJsonAtomic(path.join(dataDir, "japan.json"), prevJapan);

  await writeJsonAtomic(path.join(dataDir, "metadata.json"), metadata);

  if (okCount === 0) {
    const errors = [us, euro, japan].map((r) => r.error ?? "unknown error").join(" | ");
    throw new Error(`All markets failed: ${errors}`);
  }

  return { metadata, results: { us, euro, japan } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDataUpdate().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
