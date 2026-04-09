import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDataUpdate } from "./build-snapshots";

describe("build-snapshots integration", () => {
  it("marks one market stale and keeps prior JSON", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "yieldcurve-"));
    const dataDir = path.join(tmp, "public", "data");
    await fs.mkdir(dataDir, { recursive: true });

    const previousEuro = {
      market: "euro",
      title: "Euro Area Government Par Curve",
      source: { name: "prev", type: "prev", methodologyLabel: "prev" },
      snapshots: [
        {
          label: "Current",
          targetDate: "2026-04-01",
          actualDate: "2026-04-01",
          points: [{ tenor: "10Y", months: 120, yieldBp: 300 }]
        }
      ]
    };

    await fs.writeFile(path.join(dataDir, "euro.json"), JSON.stringify(previousEuro, null, 2));
    await fs.writeFile(
      path.join(dataDir, "us.json"),
      JSON.stringify({ market: "us", title: "United States Treasury Curve", source: { name: "prev", type: "prev", methodologyLabel: "prev" }, snapshots: [] }, null, 2)
    );
    await fs.writeFile(
      path.join(dataDir, "japan.json"),
      JSON.stringify({ market: "japan", title: "Japan Government Bond Curve", source: { name: "prev", type: "prev", methodologyLabel: "prev" }, snapshots: [] }, null, 2)
    );

    const fetchTextFn = async (url: string) => {
      if (url.includes("data-api.ecb.europa.eu")) throw new Error("ECB down");

      if (url.includes("home.treasury.gov")) {
        return (
          'Date,"1 Mo","3 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"\n' +
          "04/08/2026,3.00,3.00,3.00,3.00,3.00,3.00,3.00,3.00,3.00,3.00,3.00\n"
        );
      }

      if (url.includes("mof.go.jp")) {
        return (
          "Interest Rate,,,,\n" +
          "Date,1Y,2Y,3Y,5Y,7Y,10Y,20Y,30Y\n" +
          "2026/4/8,1.000,1.000,1.000,1.000,1.000,1.000,1.000,1.000\n"
        );
      }

      throw new Error(`unexpected url ${url}`);
    };

    const { metadata } = await runDataUpdate({
      repoRoot: tmp,
      now: new Date(Date.UTC(2026, 3, 8)),
      fetchTextFn
    });

    expect(metadata.refreshStatus.us).toBe("ok");
    expect(metadata.refreshStatus.japan).toBe("ok");
    expect(metadata.refreshStatus.euro).toBe("stale");

    const euroWritten = JSON.parse(await fs.readFile(path.join(dataDir, "euro.json"), "utf8"));
    expect(euroWritten.source.name).toBe("prev");
    expect(euroWritten.snapshots[0].points[0].yieldBp).toBe(300);
  });
});

