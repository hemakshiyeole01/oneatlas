import { describe, expect, it } from "vitest";
import { capabilityLabels, formatDate, formatPrice, formatTokens } from "./format";

describe("formatTokens", () => {
  it("formats millions and thousands", () => {
    expect(formatTokens(1_048_576)).toBe("1M");
    expect(formatTokens(200_000)).toBe("200K");
    expect(formatTokens(500)).toBe("500");
  });
});

describe("formatPrice", () => {
  it("shows a dash for missing or zero prices", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(0)).toBe("—");
  });
  it("formats small and large prices", () => {
    expect(formatPrice(2.5)).toBe("$2.50");
    expect(formatPrice(0.15)).toBe("$0.15");
    expect(formatPrice(0.248)).toBe("$0.248");
  });
});

describe("formatDate", () => {
  it("formats an ISO date", () => {
    expect(formatDate("2025-08-07T12:00:00Z")).toBe("Aug 7, 2025");
  });
});

describe("capabilityLabels", () => {
  it("lists only enabled capabilities", () => {
    expect(
      capabilityLabels({
        supportsReasoning: true,
        supportsTools: false,
        supportsVision: true,
        supportsStructuredOutput: false,
      })
    ).toEqual(["Reasoning", "Vision"]);
  });
});