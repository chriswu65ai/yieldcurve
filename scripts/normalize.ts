import type { MarketData, Snapshot } from "../shared/types";

export function assertAndNormalizeMarketData(marketData: MarketData): MarketData {
  const normalized: MarketData = {
    ...marketData,
    snapshots: marketData.snapshots.map((snapshot) => normalizeSnapshot(snapshot))
  };

  for (const snap of normalized.snapshots) {
    snap.points.sort((left, right) => left.months - right.months);
    for (const pt of snap.points) {
      pt.yieldBp = Math.round(pt.yieldBp);
    }
  }

  return normalized;
}

function normalizeSnapshot(snapshot: Snapshot): Snapshot {
  return {
    ...snapshot,
    points: snapshot.points.map((point) => ({
      ...point,
      months: Number(point.months),
      yieldBp: Math.round(point.yieldBp)
    }))
  };
}
