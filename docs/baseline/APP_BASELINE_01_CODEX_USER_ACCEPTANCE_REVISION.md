# APP-BASELINE-01 — Codex User Acceptance Revision Directive

MODEL RECOMMENDATION: SOL
IMPORTANCE: HIGH — affects Foundation Visual/UX Baseline.

Read:
- docs/baseline/APP_BASELINE_01_USER_ACCEPTANCE_REVISION_MEMO_v1.0.md
- docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md

Implement only the approved User Acceptance revision.

## 1. Typography

Current Georgia-like child-facing typography is rejected.

Required:
- remove Georgia as the child-facing brand/title default.
- do not invent an arbitrary unrelated font.
- first inspect repository/canonical assets/docs for an approved NamyKids typography source/token.
- if an exact approved font is not available, use the closest already-approved/system-safe rounded child-friendly fallback only as DEV PREVIEW and label it clearly as typography candidate for User Acceptance.
- centralize typography in tokens; no scattered fontFamily literals.

STOP only if choosing the next font would require a material brand decision with no approved basis.

## 2. Brand color tokens

Current ad-hoc green/cream/yellow palette is rejected.

Required:
- replace ad-hoc NamyScene colors with centralized NamyKids brand tokens derived from the approved primary logo / approved visual baseline already available in repo/assets/docs.
- do not invent a new palette.
- preserve calm Parent Zone distinction.
- production Soft CGI imagery remains DEV_PLACEHOLDER/BLOCKED_BY_ASSET.

If the repo does not contain enough evidence to derive the exact brand tokens, do not guess; report the missing canonical color source before locking baseline.

## 3. Interaction presentation change

Preserve GameSession semantics but remove blocking per-placement feedback panels.

Correct placement:
- remain in the same active learning scene.
- play correct acknowledgement audio hook.
- subtle visual micro-feedback only.
- automatically advance to next active placement when not complete.
- no "Đúng rồi!" full card requiring Continue.

Wrong placement:
- remain in active learning scene.
- gentle reject/return.
- play retry audio hook.
- subtle visual retry cue.
- no full retry card requiring a Retry button.

Final completion:
- only after all baseline missing positions are correct.
- transition to one S07 completion/reward screen.
- show one child-facing congratulation message.
- play completion/cheer audio hook.
- no mastery claim.

## 4. DEV preview audio

Production audio is still BLOCKED_BY_ASSET.

For DEV preview:
- use the existing audio abstraction/asset IDs.
- if no actual file exists, do not invent production audio.
- preview may show the micro-interaction without audible production voice.
- keep hooks ready for:
  correct acknowledgement
  gentle retry
  completion acknowledgement
- do not add third-party TTS/audio SDK.

## 5. Accessibility

Audio must not be the sole essential cue.
Keep non-blocking visual equivalents:
- correct: item visibly locks into target + subtle positive state.
- wrong: item visibly returns/rejects + subtle retry state.
- do not rely on color only.
- keep semantic accessibility announcements without forcing blocking visual text panels.

## 6. DEV-only Foundation Preview

Update /dev/foundation-preview to demonstrate the revised flow.

Expected User path:
S03 instruction
-> S04 active
-> correct placement: no panel, continue
-> wrong placement: no panel, retry in place
-> semantic Hint eligibility unchanged
-> all 3 correct
-> S07 one celebration screen

## 7. Validation

Run:
- typecheck
- lint
- npm test
- quality:static
- build:web
- git diff --check

Add/update tests proving:
- correct non-final placement auto-continues without blocking feedback action
- wrong placement returns to active retry without blocking Retry action
- final correct placement reaches S07
- education assessment/history/hint tests still pass
- no audio SDK/dependency drift
- DEV preview does not affect production auth/runtime

Commit and push same branch.
Do not merge main.
Do not remote deploy DB/Edge.
Do not change Product/Education mechanic.
Return:
- commit SHA
- typography source used
- color-token source used
- screenshots/preview URL
- test results
- any remaining decision gap before User Acceptance.
