import type { Metadata } from "@/data/types";
import { formatUtcTimestampForDisplay } from "@/utils/format";

export default function Header(props: { metadata: Metadata | null }) {
  const { metadata } = props;
  const generatedAt = metadata?.generatedAtUtc
    ? formatUtcTimestampForDisplay(metadata.generatedAtUtc)
    : "—";

  const anyStale =
    metadata &&
    Object.values(metadata.refreshStatus).some((status) => status !== "ok");

  return (
    <header className="header">
      <div className="header__title">Yield Curves Dashboard</div>
      <div className="header__meta">
        <span className="header__freshness">Last refresh: {generatedAt}</span>
        {anyStale ? <span className="header__stale">Some data is stale</span> : null}
      </div>
    </header>
  );
}

