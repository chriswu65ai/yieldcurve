export default function Methodology() {
  return (
    <section className="methodology">
      <details>
        <summary>Methodology</summary>
        <div className="methodology__body">
          <p>
            <strong>United States:</strong> U.S. values are Treasury par-yield curve
            nodes (official par yields at fixed maturities).
          </p>
          <p>
            <strong>Euro area:</strong> Euro-area values are ECB model-derived par
            yields for the euro area, all ratings included.
          </p>
          <p>
            <strong>Japan:</strong> Japan values are MOF official fixed-tenor JGB
            yields from 1Y upward.
          </p>
          <p>
            Snapshot dates use the nearest prior available business day for each
            requested offset (1 week, 1 month, 1 year).
          </p>
          <p>
            These markets use different methodologies and are not perfectly
            identical instruments.
          </p>
        </div>
      </details>
    </section>
  );
}

