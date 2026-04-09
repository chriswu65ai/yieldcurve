import type { MarketData, Snapshot } from "@/data/types";

type CsvRow = {
  market: string;
  snapshotLabel: string;
  targetDate: string;
  actualDate: string;
  tenor: string;
  months: number;
  yieldBp: number;
  sourceName: string;
  sourceType: string;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportVisibleSnapshotsCsv(params: {
  marketData: MarketData;
  visibleSnapshotLabels: Set<Snapshot["label"]>;
}): void {
  const { marketData, visibleSnapshotLabels } = params;

  const rows: CsvRow[] = [];
  for (const snapshot of marketData.snapshots) {
    if (!visibleSnapshotLabels.has(snapshot.label)) continue;
    for (const point of snapshot.points) {
      rows.push({
        market: marketData.market,
        snapshotLabel: snapshot.label,
        targetDate: snapshot.targetDate,
        actualDate: snapshot.actualDate,
        tenor: point.tenor,
        months: point.months,
        yieldBp: point.yieldBp,
        sourceName: marketData.source.name,
        sourceType: marketData.source.type
      });
    }
  }

  const header = [
    "market",
    "snapshotLabel",
    "targetDate",
    "actualDate",
    "tenor",
    "months",
    "yieldBp",
    "sourceName",
    "sourceType"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.market,
        row.snapshotLabel,
        row.targetDate,
        row.actualDate,
        row.tenor,
        String(row.months),
        String(row.yieldBp),
        row.sourceName,
        row.sourceType
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const safeDate = marketData.snapshots[0]?.actualDate ?? "unknown-date";
  downloadText(`${marketData.market}-curve-${safeDate}.csv`, lines.join("\n"));
}

