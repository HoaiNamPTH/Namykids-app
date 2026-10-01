# APP-BASELINE-01 — Typography Integrity Audit & Revision Memo v1.0

Date: 2026-10-01
Status: REVISION REQUIRED — NARROW BASELINE BLOCKER

## User-observed defect

Vietnamese diacritics are visually malformed/misaligned in child-facing text, including the S07 headline "Chúc mừng con!".

## CMO code audit

VERIFIED FACT:
- src/ui/brand-tokens.ts currently defines a DEV typography candidate:
  roundedPreviewCandidate = "Trebuchet MS"
- NamyScene applies that candidate to child display/title text.
- Many other text styles use no explicit family and therefore use platform/system fonts.
- This creates mixed typography behavior.
- No production UI font has been approved/loaded yet.
- No dependency currently provides a bundled production font.

DERIVED INFERENCE:
The current Trebuchet MS DEV candidate and mixed fallback path are the likely source of inconsistent Vietnamese glyph shaping/rendering in Web preview. It must not be locked into Foundation Baseline without Vietnamese glyph validation.

## Decision

Do NOT patch only one headline.
Audit and fix typography integrity globally.

The Foundation Baseline cannot be approved until:
1. all Vietnamese text renders correctly;
2. one centralized typography system is used consistently;
3. no child-facing style uses an unverified font candidate;
4. Web and native fallback behavior is safe;
5. production typography decision remains clearly separated from DEV-safe fallback if an exact brand font is still unapproved.

## Required technical principles

### Unicode / Vietnamese integrity
- Use Unicode-safe Vietnamese text.
- Validate NFC normalization for source literals/content where applicable.
- Do not manually split base letters and combining marks.
- Do not apply unsupported faux-bold/font weight that breaks glyph shaping.
- Do not use a font family unless Vietnamese glyph support is verified.

### Typography fallback policy
Until a production NamyKids UI font is explicitly approved:
- prefer platform system font as the SAFE fallback for body/buttons/child text if the current candidate fails Vietnamese coverage;
- a DEV candidate may be used only after proving all Vietnamese glyphs render correctly;
- no hidden per-screen font overrides.

### Centralization
Create one typography token map for:
- child.display
- child.title
- child.body
- child.button
- child.caption
- parent.title
- parent.body
- parent.label

No scattered fontFamily literals outside token implementation except explicit platform-level exception with documented reason.

### Cross-platform coverage
Validate on:
- Web preview
- Android React Native target behavior
- iOS React Native target behavior

Native device validation may remain later, but source/config must not knowingly depend on a Web-only font.

## Mandatory Vietnamese glyph corpus

Render and visually inspect at least:
"Chúc mừng con!"
"Kéo chữ vào ô trống"
"Chữ cái & vần"
"Nghe lại hướng dẫn"
"Con làm đúng rồi"
"Con thử lại nhé"
"Chơi mới"
"Chơi lại"
"Góc của ba mẹ"
"Đang kiểm tra hành trình an toàn"

And a glyph coverage line:
"ă â ê ô ơ ư đ Ă Â Ê Ô Ơ Ư Đ á à ả ã ạ ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ é è ẻ ẽ ẹ ế ề ể ễ ệ í ì ỉ ĩ ị ó ò ỏ õ ọ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ú ù ủ ũ ụ ứ ừ ử ữ ự ý ỳ ỷ ỹ ỵ"

## Baseline gate

APP-BASELINE-01 remains NOT APPROVED until typography integrity preview is accepted by User.
