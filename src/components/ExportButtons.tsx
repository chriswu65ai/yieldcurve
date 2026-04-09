import type { Snapshot } from "@/data/types";

export default function ExportButtons(props: {
  onCsv: () => void;
  onPng: () => void;
  visibleSnapshotLabels: Set<Snapshot["label"]>;
}) {
  const { onCsv, onPng, visibleSnapshotLabels } = props;
  const disabled = visibleSnapshotLabels.size === 0;

  return (
    <div className="export-buttons">
      <button className="button" onClick={onCsv} disabled={disabled} type="button">
        Download CSV
      </button>
      <button className="button" onClick={onPng} disabled={disabled} type="button">
        Download PNG
      </button>
    </div>
  );
}

