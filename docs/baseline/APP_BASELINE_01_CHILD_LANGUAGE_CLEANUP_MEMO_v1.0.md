# APP-BASELINE-01 — Child-Facing Language Cleanup Memo v1.0

Date: 2026-10-01
Status: REVISION REQUIRED — NARROW FOUNDATION BLOCKER

## CMO Decision

Accept Antigravity audit findings with severity recalibration.

- No technical P0.
- Child-facing English/internal/debug leakage = P1 Foundation UX blocker.
- DEV-only labels/state codes = P2 cleanup where fully isolated from child canvas.
- APP-BASELINE-01 remains NOT APPROVED until child-facing language is clean.

## Mandatory cleanup

1. Remove internal assessment labels from child feedback:
   - Independent
   - Assisted
   - Trial-and-error
   - non-independent
   - mastery

2. Child-facing UI must be Vietnamese-only.
   Replace/remove:
   - Missing Letters
   - Child World
   - Safe Recovery
   - Offline / Sync
   - Restricted
   - Reveal
   - genuine incorrect placement
   - Auth
   - child binding
   - content pin
   - canonical/durable outbox
   - remote runtime
   - entitlement production
   - token
   - placement

3. Keep approved child copy:
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

4. DEV information must be isolated from child canvas.
   Preferred implementation:
   - dedicated DEV Inspector / collapsible dock / separate DEV panel
   - do not mix debug labels inside learning scene
   - must fully unmount when preview flag is off

5. Parent Zone may expose learning summary, but use parent-friendly Vietnamese:
   - Tự làm đúng
   - Thử và tự sửa
   - Có gợi ý
   Do not render raw variable names.

## Non-goals

Do not alter:
- E02
- education assessment logic
- GameSession reducer
- auth/runtime/DB contracts
- content pin/outbox
- brand colors
- typography system already fixed
- production asset pipeline

## Gate

APP-BASELINE-01 remains NOT APPROVED until revised preview passes User Acceptance.
