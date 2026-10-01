# APP-BASELINE-01 — Codex Global Typography Integrity Directive

MODEL RECOMMENDATION: SOL
IMPORTANCE: HIGH — Foundation Baseline blocker across all screens.

Goal:
Fix Vietnamese typography rendering globally, not just S07.

Read:
- docs/baseline/APP_BASELINE_01_TYPOGRAPHY_INTEGRITY_AUDIT_v1.0.md

## 1. Audit entire codebase

Search ALL app/src/dev files for:
- fontFamily
- fontWeight
- fontStyle
- letterSpacing
- textTransform
- custom font loading
- platform-specific font overrides
- inline Text styles
- duplicate typography tokens

Return an inventory before changing behavior.

## 2. Verify current root cause

Current known candidate:
Trebuchet MS in src/ui/brand-tokens.ts.

Check:
- whether the actual browser resolves Trebuchet MS or falls back;
- whether the resolved font supports Vietnamese precomposed glyphs correctly;
- whether fontWeight 800/900 is synthesized/faux-bold;
- whether Vietnamese words mix multiple fallback fonts.

If Trebuchet MS cannot be proven safe:
REMOVE it as active child-facing DEV family.

Do not replace it with another arbitrary branded font.

## 3. Safe typography system

Centralize one typography contract.

Until exact production NamyKids font is approved:
- use platform/system-safe font for Vietnamese as the fallback baseline;
- fontFamily may be undefined/system default where that is safest;
- define semantic typography tokens for display/title/body/button/caption and parent equivalents;
- keep font size/lineHeight/weight intentional and platform-safe.

Avoid unsupported synthetic heavy weights.
If weight 800/900 causes glyph issues on a platform, choose the closest supported safe weight while preserving hierarchy.

## 4. Unicode normalization

Audit user-facing Vietnamese literals/content for Unicode composition.

Requirements:
- canonical Vietnamese strings should be NFC-normalized;
- no manual combining-mark construction;
- no accidental decomposed glyph sequences introduced by fixtures/config;
- add a small automated assertion/helper/test for representative Vietnamese text normalization where practical.

Do NOT mutate IDs, slugs, hashes, or protocol payloads merely for typography.

## 5. Global coverage

Apply the typography system to ALL user-facing text categories:
- NamyScene brand/title/description/state
- SceneAction labels
- ActivityPlayer helper/feedback/completion
- FoundationPreview
- Child World
- Subject Journey
- Parent Zone
- Restricted/Recovery
- DEV banner text
- glyph/letter tiles only if appropriate without changing educational glyph semantics

Do not change alphabet glyph identity/content.

## 6. Add DEV typography test screen/section

In /dev/foundation-preview or a dedicated DEV-only typography QA route, render:

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

Plus Vietnamese glyph corpus:
"ă â ê ô ơ ư đ Ă Â Ê Ô Ơ Ư Đ á à ả ã ạ ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ é è ẻ ẽ ẹ ế ề ể ễ ệ í ì ỉ ĩ ị ó ò ỏ õ ọ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ú ù ủ ũ ụ ứ ừ ử ữ ự ý ỳ ỷ ỹ ỵ"

Purpose:
User can visually confirm there are no broken/misaligned accents.

DEV only. Do not expose this as production content.

## 7. Web verification

In the running Web preview:
- inspect computed font-family for representative title/button/body;
- confirm no unexpected mixed family within a Vietnamese word;
- document actual resolved family;
- capture screenshot or provide exact preview route for User.

## 8. Regression constraints

Do NOT change:
- E02 mechanic
- assessment
- Hint semantics
- completion/outbox
- auth/runtime
- brand colors
- layout beyond typography-related line-height/spacing required to prevent clipping
- production asset architecture

No new font package or font file download without explicit approval.
Do not commit/share font binaries.

## 9. Tests

Add/update tests for:
- typography tokens centralized;
- no prohibited direct child-facing fontFamily override outside the token module;
- representative Vietnamese strings are NFC;
- preview typography route remains DEV-only.

Run:
- typecheck
- lint
- npm test
- quality:static
- build:web
- git diff --check

## 10. Return evidence

Return:
- root cause
- files containing typography overrides before/after
- active/resolved font family on Web
- weights used
- commit SHA
- preview URL
- screenshot location if generated
- full validation result
- explicit statement whether exact production font remains UNKNOWN/PENDING USER APPROVAL.

Commit/push same branch.
Do not merge main.
Do not remote DB/Edge deploy.
