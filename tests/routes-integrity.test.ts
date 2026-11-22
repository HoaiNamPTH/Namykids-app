import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const expectedRoutes = [
  "app/index.tsx",
  "app/(auth)/session-recovery.tsx",
  "app/(app)/child-world.tsx",
  "app/(app)/subject/[subjectId].tsx",
  "app/(app)/activity/[activityId].tsx",
  "app/(app)/parent.tsx",
  "app/(app)/recovery.tsx",
  "app/(app)/restricted.tsx",
  "app/dev/foundation-preview.tsx",
  "app/home.tsx",
  "app/area/[areaId].tsx",
  "app/game/[gameId].tsx",
  "app/album.tsx",
  "app/+not-found.tsx",
] as const;

describe("router files integrity contract", () => {
  it("ensures all expected Expo Router route files exist and are readable", () => {
    for (const route of expectedRoutes) {
      const source = readFileSync(route, "utf8");
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it("ensures index.tsx opens the kid home and keeps the dev preview gate", () => {
    const source = readFileSync("app/index.tsx", "utf8");
    expect(source).toContain('href="/dev/foundation-preview"');
    expect(source).toContain('href="/home"');
    expect(source).toContain("isFoundationPreviewEnabled");
  });

  it("ensures child-world route guards against infinite loading on recovery or restricted", () => {
    const source = readFileSync("app/(app)/child-world.tsx", "utf8");
    expect(source).toContain('runtime.status === "recovery"');
    expect(source).toContain('runtime.status === "restricted"');
    expect(source).toContain("<RecoveryScreen");
    expect(source).toContain("<RestrictedScreen");
    expect(source).toContain("onRestricted");
  });

  it("ensures subject route checks subject param and guards against infinite loading", () => {
    const source = readFileSync("app/(app)/subject/[subjectId].tsx", "utf8");
    expect(source).toContain("useLocalSearchParams");
    expect(source).toContain('subjectId !== "alphabet"');
    expect(source).toContain('runtime.status === "recovery"');
    expect(source).toContain("<RecoveryScreen");
    expect(source).toContain("<RestrictedScreen");
  });

  it("ensures activity route guards runtime and activity errors before generic loading", () => {
    const source = readFileSync("app/(app)/activity/[activityId].tsx", "utf8");
    expect(source).toContain("useLocalSearchParams");
    expect(source).toContain('runtime.status === "recovery"');
    expect(source).toContain('runtime.status === "restricted"');
    expect(source).toContain('activity.status === "restricted"');
    expect(source).toContain('activity.status === "recovery"');
    expect(source).toContain("<RecoveryScreen");
    expect(source).toContain("<RestrictedScreen");
  });

  it("ensures parent route handles recovery and restricted states gracefully", () => {
    const source = readFileSync("app/(app)/parent.tsx", "utf8");
    expect(source).toContain('runtime.status === "recovery"');
    expect(source).toContain('runtime.status === "restricted"');
    expect(source).toContain("<RecoveryScreen");
    expect(source).toContain("<RestrictedScreen");
  });

  it("ensures session-recovery route uses landscape RecoveryScreen", () => {
    const source = readFileSync("app/(auth)/session-recovery.tsx", "utf8");
    expect(source).toContain("RecoveryScreen");
    expect(source).not.toContain("NamyScene");
  });
});
