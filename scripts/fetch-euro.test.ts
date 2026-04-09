import { describe, expect, it } from "vitest";
import { fetchEuroAreaEcbParYields } from "./fetch-euro";

describe("fetch-euro", () => {
  it("parses ECB csvdata across tenors", async () => {
    const fetchTextFn = async (url: string) => {
      // Use deterministic values per tenor suffix so we can verify joins.
      const match = url.match(/\\.PY_([0-9]+[MY])\\?/);
      const tenor = match?.[1] ?? "10Y";
      const value = tenor.endsWith("Y") ? Number(tenor.replace("Y", "")) : 0.1;
      const obs = (value + 0.25).toFixed(6);

      return [
        "KEY,TIME_PERIOD,OBS_VALUE",
        `dummy,2026-04-08,${obs}`
      ].join("\n");
    };

    const table = await fetchEuroAreaEcbParYields({
      startPeriod: "2026-01-01",
      endPeriod: "2026-04-08",
      fetchTextFn
    });

    expect(table.datesAsc).toEqual(["2026-04-08"]);
    // Ensure multiple tenors were merged into the same date row.
    expect(table.byDate.get("2026-04-08")?.size).toBeGreaterThan(5);
  });
});

