import { describe, expect, it } from "vitest";
import { fetchJapanMofJgbRates } from "./fetch-japan";

describe("fetch-japan", () => {
  it("parses MOF CSV and maps to bp", async () => {
    const csv =
      "Interest Rate,,,,\n" +
      "Date,1Y,2Y,3Y,5Y,7Y,10Y,20Y,30Y\n" +
      "2026/4/8,0.500,0.600,0.700,1.000,1.200,1.400,2.000,2.200\n";

    const table = await fetchJapanMofJgbRates({
      fetchTextFn: async () => csv
    });

    expect(table.datesAsc).toEqual(["2026-04-08"]);
    expect(table.byDate.get("2026-04-08")?.get("10Y")).toBe(140);
  });
});

