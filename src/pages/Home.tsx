import { useEffect, useMemo, useState } from "react";
import type { MarketData, MarketId, Metadata } from "@/data/types";
import CurveChart from "@/components/CurveChart";
import Header from "@/components/Header";
import Methodology from "@/components/Methodology";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export default function Home() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [markets, setMarkets] = useState<Partial<Record<MarketId, MarketData>>>({});

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetchJson<Metadata>(`${base}data/metadata.json`)
      .then(setMetadata)
      .catch(() => setMetadata(null));

    const ids: MarketId[] = ["us", "euro", "japan"];
    Promise.all(
      ids.map(async (id) => {
        const data = await fetchJson<MarketData>(`${base}data/${id}.json`);
        return [id, data] as const;
      })
    )
      .then((pairs) => {
        const next: Partial<Record<MarketId, MarketData>> = {};
        for (const [id, data] of pairs) next[id] = data;
        setMarkets(next);
      })
      .catch(() => setMarkets({}));
  }, []);

  const refreshStatus = metadata?.refreshStatus ?? {
    us: "stale",
    euro: "stale",
    japan: "stale"
  };

  const us = markets.us;
  const euro = markets.euro;
  const japan = markets.japan;

  const cards = useMemo(() => {
    const order: Array<{ id: MarketId; data?: MarketData }> = [
      { id: "us", data: us },
      { id: "euro", data: euro },
      { id: "japan", data: japan }
    ];
    return order;
  }, [us, euro, japan]);

  return (
    <div className="page">
      <Header metadata={metadata} />
      <main className="content">
        {cards.map((c) =>
          c.data ? (
            <CurveChart
              key={c.id}
              marketData={c.data}
              isStale={refreshStatus[c.id] !== "ok"}
            />
          ) : (
            <div className="card" key={c.id}>
              <div className="card__header">
                <div className="card__title">Loading…</div>
              </div>
              <div className="empty">Loading local JSON…</div>
            </div>
          )
        )}
        <Methodology />
      </main>
      <footer className="footer">
        <span>Static site. Browser loads local JSON only.</span>
      </footer>
    </div>
  );
}

