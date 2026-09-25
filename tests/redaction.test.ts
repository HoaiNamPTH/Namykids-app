import { describe, expect, it } from "vitest";
import { redactForLog } from "../src/observability/redaction";

describe("privacy-safe redaction", () => {
  it("removes secrets and PII-like fields from diagnostic values", () => {
    expect(
      redactForLog({
        routeCode: "S04",
        authorization: "sensitive",
        child: { nickname: "sensitive" },
        completionId: "correlation-only"
      })
    ).toEqual({
      routeCode: "S04",
      authorization: "[REDACTED]",
      child: { nickname: "[REDACTED]" },
      completionId: "correlation-only"
    });
  });
});
