import { describe, expect, it } from "vitest";
import {
  addDays,
  pickNearestOnOrBefore,
  subCalendarMonth,
  subCalendarYear,
  type IsoDate
} from "./dates";

describe("dates", () => {
  it("subCalendarMonth clamps end-of-month", () => {
    expect(subCalendarMonth("2026-03-31")).toBe("2026-02-28");
    expect(subCalendarMonth("2024-03-31")).toBe("2024-02-29");
  });

  it("subCalendarYear clamps leap day", () => {
    expect(subCalendarYear("2024-02-29")).toBe("2023-02-28");
  });

  it("pickNearestOnOrBefore picks exact or prior", () => {
    const dates: IsoDate[] = ["2026-04-01", "2026-04-03", "2026-04-08"];
    expect(pickNearestOnOrBefore(dates, "2026-04-08")).toBe("2026-04-08");
    expect(pickNearestOnOrBefore(dates, "2026-04-07")).toBe("2026-04-03");
  });

  it("pickNearestOnOrBefore falls back to earliest if target precedes", () => {
    const dates: IsoDate[] = ["2026-04-01", "2026-04-03"];
    expect(pickNearestOnOrBefore(dates, "2026-03-01")).toBe("2026-04-01");
  });

  it("addDays moves across months", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

