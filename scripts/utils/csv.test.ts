import { describe, expect, it } from "vitest";
import { parseCsv, rowsToObjects } from "./csv";

describe("csv", () => {
  it("parses quoted commas and escaped quotes", () => {
    const text = 'a,b,c\n"hello, world","He said ""hi""",3\n';
    const rows = parseCsv(text);
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["hello, world", 'He said "hi"', "3"]
    ]);
  });

  it("rowsToObjects maps header to values", () => {
    const rows = parseCsv("x,y\n1,2\n");
    expect(rowsToObjects(rows)).toEqual([{ x: "1", y: "2" }]);
  });
});

