# APP-BASELINE-01 — Codex Child-Facing Language Cleanup Directive

MODEL RECOMMENDATION: SOL
IMPORTANCE: HIGH — Foundation UX baseline blocker across S01–S12.

Implement one consolidated child-facing language cleanup pass.

Read:
- docs/baseline/APP_BASELINE_01_CHILD_LANGUAGE_CLEANUP_MEMO_v1.0.md

## A. Remove internal assessment labels from child canvas

In S04/S05/S06 micro-feedback:
REMOVE rendering of:
- Independent
- Assisted
- Trial-and-error
- non-independent
- mastery

Child sees only:
- correct: "Con làm đúng rồi"
- retry: "Con thử lại nhé"

Keep assessment state internally unchanged.

## B. Vietnamese-only child-facing copy

Audit S01–S12 and accessibility labels/hints.

Replace/remove all user-visible English/internal terms including:
Missing Letters, Child World, Safe Recovery, Offline / Sync, Restricted,
Reveal, assisted, genuine incorrect placement,
Auth, child binding, content pin, canonical outbox, durable outbox,
remote runtime, entitlement production, token, placement,
DEV_PLACEHOLDER, BLOCKED_BY_ASSET, Fixture, User Acceptance.

Suggested child-facing replacements:
- "Bắt đầu lượt Missing Letters" -> "Bắt đầu chơi"
- "Quay về Child World" -> "Về trang chủ" or "Quay lại"
- Hint available -> "Mở một ô chữ giúp con"
- Hint unavailable -> "Nút gợi ý sẽ mở khi con cần giúp"
- S08 -> "Bé chờ một chút xíu nhé, bài học sắp bắt đầu rồi!"
- S11 -> "Bài học này tạm thời chưa mở. Con hãy chọn bài học khác nhé!"
- S12 -> "Đã có chút gián đoạn nhỏ. Mọi tiến độ của bé vẫn được giữ an toàn. Ba mẹ hãy thử lại nhé!"

Do not mechanically replace internal code identifiers; only presentation strings/accessibility text.

## C. Remove DEV/debug content from child learning scenes

Remove from child canvas:
- PreviewBanner
- Typography QA buttons
- "Xem Restricted"
- "Xem Safe Recovery"
- technical asset notes
- QA navigation controls
- technical explanation paragraphs

Do not delete QA capability.
Move them into a dedicated DEV-only inspector/panel/drawer outside the child canvas.

Inspector requirements:
- only when Foundation Preview flag is enabled
- clearly separated from child UI
- may show state code, assessment class, engine, font QA navigation
- completely unmounted when preview flag disabled

## D. Parent Zone cleanup

S10 may show assessment summary only in parent-friendly Vietnamese:
- Tự làm đúng: X
- Thử và tự sửa: Y
- Có gợi ý: Z

Do not display raw English variable labels.

## E. Keep approved child copy

Do not rewrite approved strings unless necessary for grammar/layout:
- Chào con đến với NamyKids
- Chữ cái & vần
- Kéo chữ vào ô trống
- Chữ cái còn thiếu
- Chúc mừng con!
- Góc của ba mẹ
- Nhìn dãy chữ theo thứ tự, rồi đặt mỗi chữ còn thiếu vào đúng chỗ.
- Kéo một thẻ vào ô trống, hoặc chọn thẻ rồi chạm ô trống.
- Con làm đúng rồi
- Con thử lại nhé
- Bắt đầu
- Nghe lại hướng dẫn
- Gợi ý
- Lượt mới
- Chơi mới
- Chơi lại
- Quay lại

## F. Accessibility

Audit accessibilityLabel/accessibilityHint separately.
No English/internal/debug jargon may be read aloud by VoiceOver/TalkBack in child flow.

## G. Tests

Add/adjust tests to prove:
- child canvas contains no banned internal terms
- assessment labels are absent from child feedback
- S07 remains only one headline + two actions
- S10 uses Vietnamese parent-friendly labels
- DEV inspector is disabled/unmounted outside preview
- accessibility hints are Vietnamese-only in child flow
- education assessment behavior unchanged

Run:
- typecheck
- lint
- npm test
- quality:static
- build:web
- git diff --check

Return:
- commit SHA
- list of child-facing strings changed
- list of DEV items moved to inspector
- preview URL
- tests
- confirmation no DB/Auth/runtime/education logic changes

Commit/push same branch.
Do not merge main.
Do not remote DB/Edge deploy.
