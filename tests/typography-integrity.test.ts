import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isNfcNormalized,
  namyTypography,
  namyTypographySource,
  typographyQaPhrases,
  vietnameseGlyphCorpus,
} from "../src/ui/typography";

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("global typography integrity", () => {
  it("defines the complete semantic typography contract with system-safe weights", () => {
    expect(Object.keys(namyTypography.child)).toEqual(["display", "title", "body", "button", "caption"]);
    expect(Object.keys(namyTypography.parent)).toEqual(["title", "body", "label"]);

    const tokens = [...Object.values(namyTypography.child), ...Object.values(namyTypography.parent)];
    expect(tokens.every((token) => token.fontFamily === undefined)).toBe(true);
    expect(tokens.map((token) => token.fontWeight)).toEqual(["700", "700", "400", "700", "600", "700", "400", "600"]);
    expect(namyTypographySource.activeFamily).toBe("Platform system default");
    expect(namyTypographySource.productionStatus).toBe("PENDING USER APPROVAL");
  });

  it("keeps typography overrides centralized in the token module", () => {
    const directOverride = /\b(fontFamily|fontWeight|fontStyle|letterSpacing|textTransform)\s*:/;
    const violations = [...sourceFiles("app"), ...sourceFiles("src")]
      .filter((path) => !path.endsWith(join("src", "ui", "typography.ts")))
      .filter((path) => directOverride.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  it("keeps the Vietnamese QA corpus and source files NFC-normalized", () => {
    expect(typographyQaPhrases).toEqual([
      "Chúc mừng con!",
      "Kéo chữ vào ô trống",
      "Chữ cái & vần",
      "Nghe lại hướng dẫn",
      "Con làm đúng rồi",
      "Con thử lại nhé",
      "Chơi mới",
      "Chơi lại",
      "Góc của ba mẹ",
      "Đang kiểm tra hành trình an toàn",
    ]);
    expect([...typographyQaPhrases, vietnameseGlyphCorpus].every(isNfcNormalized)).toBe(true);

    const nonNfcSources = [...sourceFiles("app"), ...sourceFiles("src")]
      .filter((path) => !isNfcNormalized(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(nonNfcSources).toEqual([]);
  });
});
