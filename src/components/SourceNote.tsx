import type { MarketId } from "@/data/types";

const NOTES: Record<MarketId, string> = {
  us: "Source: U.S. Treasury Daily Treasury Par Yield Curve Rates. Type: Official par yield curve.",
  euro: "Source: ECB euro-area yield curve dataset. Type: Official model-derived par curve, all ratings included.",
  japan: "Source: Ministry of Finance Japan JGB Interest Rate. Type: Official fixed-tenor MOF series."
};

export default function SourceNote(props: { market: MarketId }) {
  return <div className="source-note">{NOTES[props.market]}</div>;
}

