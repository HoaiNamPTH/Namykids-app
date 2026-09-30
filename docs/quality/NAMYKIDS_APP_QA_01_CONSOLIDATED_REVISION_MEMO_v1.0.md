# NamyKids APP-QA-01 — Consolidated CMO Revision Memo v1.0

Date: 2026-09-30
Baseline: codex/app-build-02-pass1 @ 72f56c21fb2f68278f96ca9d4f10d74802bf44ff

## 1. CMO Decision

REVISION REQUIRED — NARROW

APP-QA-01 is not closed yet.

Reason:
Visual/Interaction is PASS WITH CONDITIONS with no P0/P1.
Code/Runtime and Policy/Quality have no new blocking architectural contradiction.
Education review identified two implementation gaps that affect the approved invisible-assessment and semantic-hint canon.

No Product/Education/UX baseline change is authorized or required.

## 2. Layer A — Code / Runtime

VERIFIED FACT:
- canonical GameSession reducer is used.
- session pin/content release pin is preserved.
- durable completion outbox and stable completion_id are implemented.
- entitlement gating is content-level and fixed in commit 72f56c2.
- child binding/bootstrap boundaries remain intact.

VERIFIED GAP:
- GameSession stores attemptCount and lastAttempt.independentlyAssessable.
- E02 evaluateDrop marks a correct attempt independently assessable when correct && !answerRevealed.
- Current implementation does not carry prior wrong-attempt history into the later successful placement assessment.
- Completion result payload does not persist a trial-and-error/independent-evidence summary.

## 3. Layer B — Visual / Interaction

Status: PASS WITH CONDITIONS.

Accepted specialist result:
- no P0/P1 interaction contradiction.
- touch targets, select_then_place, scroll lock, non-color cues and semantic accessibility structure are acceptable.
- final production raster/audio remain BLOCKED_BY_ASSET.
- standalone /restricted S08 vs S11 is P2 and non-blocking.

## 4. Layer C — Education

Status: REVIEW.

Finding EDU-01 — random/lucky trial-and-error evidence integrity
Severity: MATERIAL / EDUCATION REVIEW BLOCKER

Current issue:
A later correct placement can still be marked independentlyAssessable=true even when that same item/target was reached after prior wrong placement behavior in the same round.

Required correction:
- Track semantic wrong-attempt history at round/session level.
- A correct placement must NOT be counted as independent evidence when the successful item or target has already participated in a wrong placement in the current round.
- Do not change child-facing gentle retry.
- Persist or derive an assessment summary sufficient to distinguish independent success from trial-and-error success.
- Completion still means completion, never mastery.

Implementation freedom:
Codex may choose the minimal internal shape (sets/map/resultPayload fields) without schema migration if existing resultPayload is sufficient.
Do not invent new business KPI or mastery model.

Finding EDU-02 — hint eligibility
Severity: MATERIAL / EDUCATION REVIEW BLOCKER

Current issue:
The Hint action is available whenever stage === active.

Required correction:
- Hint must not be freely available immediately on entering ACTIVE.
- Hint eligibility must be unlocked by a semantic struggle signal, not elapsed time and not a fixed numeric threshold.
- Minimum approved semantic signal for this slice: at least one genuine incorrect placement event in the current round.
- After a wrong-attempt/retry semantic event, Hint may become available.
- No fixed timer.
- No rule such as "after exactly 2 errors".
- Existing answer-revealing behavior remains assisted=true and independentlyAssessable=false.

## 5. Layer D — Policy / Quality

PASS WITH CONDITIONS.

No new P0/P1 found in this QA pass.
Carry-forward validation:
- real non-production Web token -> runtime-bootstrap -> Child World E2E
- real identity binding
- physical-device native cold/resume
- VoiceOver/TalkBack device validation
- production raster/audio assets
- Final Visual QA

These do not replace the two Education corrections above.

## 6. What NOT to change

Do NOT change:
- E02 DRAG_DROP as primary mechanic
- select_then_place accessibility alternative
- baseline 3 missing positions
- shuffled tray
- refresh lock after first placement
- gentle retry
- content pin/session resume
- GameSession state machine structure
- entitlement architecture
- DB/auth/runtime contracts unless a genuine technical blocker is discovered
- visual direction
- legacy Figma remains non-canonical

## 7. Required Codex Revision

Make one narrow QA patch:
A. trial-and-error evidence integrity
B. semantic Hint eligibility

No migration expected.
No new package expected.
No Product/UX redesign.
No production asset work in this patch.

Tests required:
1. first-attempt correct + no reveal => independent=true
2. wrong item -> later same item correct => independent=false
3. wrong target -> later correct target => independent=false
4. hint-revealed correct => independent=false and assisted=true
5. Hint unavailable at fresh ACTIVE
6. one genuine incorrect placement/retry event => Hint eligible
7. no timer/count-based unlock
8. completion result retains correct assisted/trial-and-error evidence
9. existing outbox/session-pin/completion tests no regression

Run:
- typecheck
- lint
- npm test
- quality:static
- build:web
- git diff --check

Commit/push same branch.
No main merge.
No remote DB/Edge deploy.

## 8. Next Gate

After revised commit:
CMO audits only the narrow delta.

If PASS:
APP-QA-01 => PASS WITH CONDITIONS / CLOSED
Next allowed step:
APP-BASELINE-01 — User Acceptance + Foundation Baseline Lock.
