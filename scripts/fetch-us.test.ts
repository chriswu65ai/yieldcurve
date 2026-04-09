import { describe, expect, it } from "vitest";
import { fetchUsTreasuryParYields } from "./fetch-us";

describe("fetch-us", () => {
  it("parses Treasury CSV and maps to bp", async () => {
    const csv2025 =
      'Date,"1 Mo","3 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"\n' +
      "12/31/2025,5.00,5.00,5.00,5.00,5.00,5.00,5.00,5.00,5.00,5.00,5.00\n";
    const csv2026 =
      'Date,"1 Mo","3 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"\n' +
      "01/02/2026,3.67,3.69,3.73,3.69,3.79,3.78,3.92,4.10,4.29,4.87,4.89\n";

    const fetchTextFn = async (url: string) => {
      if (url.includes("/2025/")) return csv2025;
      if (url.includes("/2026/")) return csv2026;
      throw new Error(`unexpected url ${url}`);
    };

    const table = await fetchUsTreasuryParYields({
      now: new Date(Date.UTC(2026, 3, 8)),
      fetchTextFn
    });

    expect(table.datesAsc.at(-1)).toBe("2026-01-02");
    expect(table.byDate.get("2026-01-02")?.get("10Y")).toBe(429);
  });
});

