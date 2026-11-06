import { describe, expect, it } from "vitest";
import type {
  EventReportCamp,
  EventReportStatementByCamp,
} from "../types";
import {
  describeVennRegion,
  getCampAgreePercent,
  getVennDotSizePx,
  getVennRegionKey,
  NO_CAMP_REGION_KEY,
  placeVennDots,
} from "./event-report-venn";

const CAMP_IDS = ["converts", "hourlies", "squeezed"];

const statementByCamp = (
  statementId: string,
  [convertsPercent, hourliesPercent, squeezedPercent]: [
    number,
    number,
    number,
  ],
): EventReportStatementByCamp => ({
  statementId,
  text: `Statement ${statementId}`,
  postNumber: 1,
  isAttendeeStatement: false,
  overallAgreePercent: 60,
  campAgreements: [
    { campId: "converts", agreePercent: convertsPercent },
    { campId: "hourlies", agreePercent: hourliesPercent },
    { campId: "squeezed", agreePercent: squeezedPercent },
  ],
});

const camp = (campId: string, name: string): EventReportCamp => ({
  campId,
  name,
  description: "",
  memberCount: 10,
  sizePercent: 33,
  representativeStatements: [],
});

const CAMPS = [
  camp("converts", "The Value Converts"),
  camp("hourlies", "The Pragmatic Hourlies"),
  camp("squeezed", "The AI Squeezed"),
];

describe("getCampAgreePercent", () => {
  it("reads one camp's agreement", () => {
    const statement = statementByCamp("a", [92, 35, 40]);
    expect(getCampAgreePercent(statement, "hourlies")).toBe(35);
  });

  it("is zero for a camp with no agreement listed", () => {
    const statement = statementByCamp("a", [92, 35, 40]);
    expect(getCampAgreePercent(statement, "unknown")).toBe(0);
  });
});

describe("getVennRegionKey", () => {
  it("lists every camp at or over the threshold", () => {
    const statement = statementByCamp("a", [86, 60, 40]);
    expect(getVennRegionKey(statement, CAMP_IDS)).toBe("0-1");
  });

  it("puts statements every camp agreed with in the middle", () => {
    const statement = statementByCamp("a", [94, 81, 86]);
    expect(getVennRegionKey(statement, CAMP_IDS)).toBe("0-1-2");
  });

  it("puts statements no camp agreed with outside", () => {
    const statement = statementByCamp("a", [20, 55, 50]);
    expect(getVennRegionKey(statement, CAMP_IDS)).toBe(
      NO_CAMP_REGION_KEY,
    );
  });
});

describe("placeVennDots", () => {
  it("spreads dots in the same region apart", () => {
    const statements = [
      statementByCamp("a", [92, 35, 40]),
      statementByCamp("b", [88, 38, 44]),
    ];
    const [firstDot, secondDot] = placeVennDots(statements, CAMP_IDS);
    expect(firstDot.regionKey).toBe("0");
    expect(secondDot.regionKey).toBe("0");
    expect([firstDot.x, firstDot.y]).not.toEqual([
      secondDot.x,
      secondDot.y,
    ]);
  });

  it("places nothing for an unsupported number of camps", () => {
    const statements = [statementByCamp("a", [92, 35, 40])];
    expect(placeVennDots(statements, ["only-camp"])).toEqual([]);
  });

  it("keeps many dots in one region from landing on each other", () => {
    const statements = Array.from({ length: 16 }, (_, index) =>
      statementByCamp(`dot-${index}`, [90, 10, 10]),
    );
    const dotPositions = placeVennDots(statements, CAMP_IDS).map(
      (dot) => `${dot.x},${dot.y}`,
    );
    expect(new Set(dotPositions).size).toBe(16);
  });
});

describe("getVennDotSizePx", () => {
  it("grows with agreement", () => {
    expect(getVennDotSizePx(80)).toBeGreaterThan(
      getVennDotSizePx(50),
    );
  });

  it("stays within its smallest and largest sizes", () => {
    expect(getVennDotSizePx(0)).toBe(9);
    expect(getVennDotSizePx(100)).toBe(22);
  });
});

describe("describeVennRegion", () => {
  it("names every camp agreeing", () => {
    expect(describeVennRegion("0-1-2", CAMPS)).toBe(
      "All 3 camps agreed",
    );
  });

  it("names a pair of camps", () => {
    expect(describeVennRegion("0-2", CAMPS)).toBe(
      "The Value Converts and The AI Squeezed agreed",
    );
  });

  it("names a single camp", () => {
    expect(describeVennRegion("1", CAMPS)).toBe(
      "Only The Pragmatic Hourlies agreed",
    );
  });

  it("says when no camp agreed", () => {
    expect(describeVennRegion(NO_CAMP_REGION_KEY, CAMPS)).toBe(
      "No camp agreed",
    );
  });

  it("says both when there are two camps", () => {
    expect(describeVennRegion("0-1", CAMPS.slice(0, 2))).toBe(
      "Both camps agreed",
    );
  });
});