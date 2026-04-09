import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MarketData, Snapshot } from "@/data/types";
import { exportVisibleSnapshotsCsv } from "@/utils/exportCsv";
import { exportCardPng } from "@/utils/exportPng";
import { formatBp } from "@/utils/format";
import ExportButtons from "./ExportButtons";
import SourceNote from "./SourceNote";

type ChartRow = {
  tenor: string;
  months: number;
  [key: string]: number | null | string;
};

const SNAPSHOT_ORDER: Snapshot["label"][] = [
  "Current",
  "1 week ago",
  "1 month ago",
  "1 year ago"
];

function supportedTenors(market: MarketData["market"]): Array<{ tenor: string; months: number }> {
  if (market === "us") {
    return [
      { tenor: "1M", months: 1 },
      { tenor: "3M", months: 3 },
      { tenor: "6M", months: 6 },
      { tenor: "1Y", months: 12 },
      { tenor: "2Y", months: 24 },
      { tenor: "3Y", months: 36 },
      { tenor: "5Y", months: 60 },
      { tenor: "7Y", months: 84 },
      { tenor: "10Y", months: 120 },
      { tenor: "20Y", months: 240 },
      { tenor: "30Y", months: 360 }
    ];
  }
  if (market === "euro") {
    return [
      { tenor: "3M", months: 3 },
      { tenor: "6M", months: 6 },
      { tenor: "1Y", months: 12 },
      { tenor: "2Y", months: 24 },
      { tenor: "3Y", months: 36 },
      { tenor: "5Y", months: 60 },
      { tenor: "7Y", months: 84 },
      { tenor: "10Y", months: 120 },
      { tenor: "20Y", months: 240 },
      { tenor: "30Y", months: 360 }
    ];
  }
  return [
    { tenor: "1Y", months: 12 },
    { tenor: "2Y", months: 24 },
    { tenor: "3Y", months: 36 },
    { tenor: "5Y", months: 60 },
    { tenor: "7Y", months: 84 },
    { tenor: "10Y", months: 120 },
    { tenor: "20Y", months: 240 },
    { tenor: "30Y", months: 360 }
  ];
}

function buildColorShades(base: { current: string; week: string; month: string; year: string }) {
  return {
    Current: base.current,
    "1 week ago": base.week,
    "1 month ago": base.month,
    "1 year ago": base.year
  } satisfies Record<Snapshot["label"], string>;
}

function marketColors(market: MarketData["market"]): Record<Snapshot["label"], string> {
  if (market === "us") {
    return buildColorShades({
      current: "#b91c1c",
      week: "#dc2626",
      month: "#f87171",
      year: "#fecaca"
    });
  }
  if (market === "euro") {
    return buildColorShades({
      current: "#1d4ed8",
      week: "#2563eb",
      month: "#60a5fa",
      year: "#bfdbfe"
    });
  }
  return buildColorShades({
    current: "#15803d",
    week: "#16a34a",
    month: "#4ade80",
    year: "#bbf7d0"
  });
}

function yTicks(): number[] {
  const ticks: number[] = [];
  for (let t = 50; t <= 700; t += 25) ticks.push(t);
  return ticks;
}

function CustomTooltip(props: {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string; value?: number | null }>;
  marketData: MarketData;
  visibleSnapshotLabels: Set<Snapshot["label"]>;
}) {
  const { active, payload, label, marketData, visibleSnapshotLabels } = props;
  if (!active || !payload || !label) return null;

  const snapshotByLabel = new Map(marketData.snapshots.map((s) => [s.label, s]));
  const items = payload
    .map((p) => {
      const dataKey = p.dataKey as Snapshot["label"] | undefined;
      if (!dataKey) return null;
      if (!visibleSnapshotLabels.has(dataKey)) return null;
      const snapshot = snapshotByLabel.get(dataKey);
      if (!snapshot) return null;
      return { label: dataKey, value: p.value ?? null, snapshot };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  if (items.length === 0) return null;

  return (
    <div className="tooltip">
      <div className="tooltip__title">{marketData.title}</div>
      <div className="tooltip__row">
        <span className="tooltip__label">Market</span>
        <span className="tooltip__value">{marketData.market}</span>
      </div>
      <div className="tooltip__row">
        <span className="tooltip__label">Tenor</span>
        <span className="tooltip__value">{label}</span>
      </div>
      {items.map((it) => (
        <div key={it.label} className="tooltip__block">
          <div className="tooltip__row">
            <span className="tooltip__label">Snapshot</span>
            <span className="tooltip__value">{it.label}</span>
          </div>
          <div className="tooltip__row">
            <span className="tooltip__label">Yield</span>
            <span className="tooltip__value">{formatBp(it.value as number | null)}</span>
          </div>
          <div className="tooltip__row">
            <span className="tooltip__label">Actual date</span>
            <span className="tooltip__value">{it.snapshot.actualDate}</span>
          </div>
          <div className="tooltip__row">
            <span className="tooltip__label">Source</span>
            <span className="tooltip__value">{marketData.source.name}</span>
          </div>
          <div className="tooltip__row">
            <span className="tooltip__label">Source type</span>
            <span className="tooltip__value">{marketData.source.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CurveChart(props: { marketData: MarketData; isStale: boolean }) {
  const { marketData, isStale } = props;
  const colors = marketColors(marketData.market);

  const defaultVisible = new Set<Snapshot["label"]>(SNAPSHOT_ORDER);
  const [visibleSnapshotLabels, setVisibleSnapshotLabels] = useState(defaultVisible);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const snapshotByLabel = useMemo(
    () => new Map(marketData.snapshots.map((s) => [s.label, s] as const)),
    [marketData.snapshots]
  );

  const chartData = useMemo<ChartRow[]>(() => {
    const tenors = supportedTenors(marketData.market);
    const rows: ChartRow[] = tenors.map((t) => ({ tenor: t.tenor, months: t.months }));

    for (const label of SNAPSHOT_ORDER) {
      const snap = snapshotByLabel.get(label);
      if (!snap) continue;
      const byTenor = new Map(snap.points.map((p) => [p.tenor, p.yieldBp] as const));
      for (const row of rows) row[label] = byTenor.get(row.tenor) ?? null;
    }

    return rows;
  }, [marketData.snapshots, snapshotByLabel]);

  const hasData = marketData.snapshots.length > 0 && chartData.length > 0;

  const onLegendClick = (label: Snapshot["label"]) => {
    setVisibleSnapshotLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const legendPayload = SNAPSHOT_ORDER.filter((label) => snapshotByLabel.has(label)).map(
    (label) => ({
      value: label,
      type: "line" as const,
      color: colors[label],
      id: label
    })
  );

  return (
    <div className="card" ref={cardRef}>
      <div className="card__header">
        <div className="card__title">{marketData.title}</div>
        <div className="card__right">
          {isStale ? <span className="badge">Stale data</span> : null}
          <ExportButtons
            visibleSnapshotLabels={visibleSnapshotLabels}
            onCsv={() =>
              exportVisibleSnapshotsCsv({ marketData, visibleSnapshotLabels })
            }
            onPng={async () => {
              const el = cardRef.current;
              if (!el) return;
              const safeDate = marketData.snapshots[0]?.actualDate ?? "unknown-date";
              await exportCardPng({
                element: el,
                filename: `${marketData.market}-curve-${safeDate}.png`
              });
            }}
          />
        </div>
      </div>

      {!hasData ? (
        <div className="empty">Data unavailable.</div>
      ) : (
        <div className="chart">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="tenor" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[50, 700]}
                ticks={yTicks()}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}`}
                label={{ value: "bp", angle: -90, position: "insideLeft", offset: 10 }}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    marketData={marketData}
                    visibleSnapshotLabels={visibleSnapshotLabels}
                  />
                }
              />
              <Legend
                payload={legendPayload}
                onClick={(e) => onLegendClick((e as any).value)}
                wrapperStyle={{ cursor: "pointer" }}
              />
              {SNAPSHOT_ORDER.filter((label) => snapshotByLabel.has(label)).map((label) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={colors[label]}
                  strokeWidth={label === "Current" ? 3 : 2}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                  hide={!visibleSnapshotLabels.has(label)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <SourceNote market={marketData.market} />
    </div>
  );
}
