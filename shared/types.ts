export type MarketId = "us" | "euro" | "japan";
export type RefreshStatus = "ok" | "stale";

export type Metadata = {
  generatedAtUtc: string;
  siteVersion: string;
  markets: MarketId[];
  refreshStatus: Record<MarketId, RefreshStatus>;
};

export type SourceInfo = {
  name: string;
  type: string;
  methodologyLabel: string;
};

export type CurvePoint = {
  tenor: string;
  months: number;
  yieldBp: number;
};

export type SnapshotLabel = "Current" | "1 week ago" | "1 month ago" | "1 year ago";

export type Snapshot = {
  label: SnapshotLabel;
  targetDate: string;
  actualDate: string;
  points: CurvePoint[];
};

export type MarketData = {
  market: MarketId;
  title: string;
  source: SourceInfo;
  snapshots: Snapshot[];
};

