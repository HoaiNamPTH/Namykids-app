# APP-BASELINE-01 — User Acceptance Revision Memo v1.0

Date: 2026-10-01
User Acceptance preview: DEV-only Foundation Preview
Baseline under review: codex/app-build-02-pass1 @ 753b9135c8dc819c1dc29644024454af12e44afb

## CMO Decision

NOT APPROVED YET — REVISION REQUIRED BEFORE FOUNDATION BASELINE LOCK

This is a User Decision Owner revision request during APP-BASELINE-01.

## User findings accepted

### UA-01 — Typography does not match approved NamyKids visual direction
Status: MATERIAL VISUAL BASELINE ISSUE

Observed:
Current preview uses Georgia-like serif presentation and the child-facing title renders awkwardly.

Decision:
- current typography is not accepted as Foundation Baseline.
- do not invent another arbitrary font.
- implementation must use a NamyKids-approved child-friendly typography system sourced from the approved visual/brand baseline.
- if no exact approved typeface token exists in canonical assets/docs, keep this as a narrow visual decision gap and surface the candidate typography for User acceptance before lock.

### UA-02 — Current UI colors do not match NamyKids brand
Status: MATERIAL VISUAL BASELINE ISSUE

Observed:
Current green/cream/yellow placeholder UI palette is not accepted as NamyKids brand presentation.

Decision:
- current ad-hoc palette in NamyScene must not become baseline.
- derive UI tokens from the approved NamyKids primary logo + approved Soft CGI visual source.
- do not invent a new palette.
- keep final production imagery BLOCKED_BY_ASSET, but the structural UI tokens shown in preview must already follow the approved brand direction closely enough for User Acceptance.

### UA-03 — Per-placement full feedback panels are too interruptive
Status: MATERIAL UX PRESENTATION CHANGE — USER APPROVED

Current implementation:
- correct placement routes presentation to S05 card/panel and waits for Continue.
- incorrect placement routes presentation to S06 card/panel and waits for Retry.

User-approved revised behavior:
- Correct placement:
  - no blocking feedback panel;
  - keep child in the active learning scene;
  - play voice acknowledgement: "Con làm đúng rồi" (exact production wording may be content-versioned);
  - provide subtle non-blocking visual micro-feedback;
  - automatically continue to next missing position.
- Incorrect placement:
  - no blocking feedback panel;
  - item returns/rejects gently;
  - play voice acknowledgement: "Con thử lại nhé";
  - provide subtle non-blocking visual retry cue;
  - stay in active learning scene.
- After all 3 baseline missing letters are correctly placed:
  - transition to one completion/reward state only;
  - show a clear congratulation message equivalent to "Chúc mừng con đã làm đúng";
  - play completion/cheer audio;
  - positive Soft CGI celebration once production assets exist.

## Accessibility / audio safety condition

User requested no on-screen text panel for every correct/incorrect placement.

Canonical audio/accessibility rules still apply:
- audio cannot be the only essential feedback channel;
- audio failure/sound-off must still have a safe non-blocking visual equivalent;
- do NOT reintroduce blocking text panels just for fallback;
- use micro-animation/state change/return-to-tray/lock-in-place/non-color cue plus accessible semantic announcement where appropriate.

## Architecture constraint

Do not change:
- E02 DRAG_DROP
- GameSession canonical semantic states
- trial-and-error evidence integrity
- semantic Hint eligibility
- completion/outbox/content-pin architecture

S05/S06 may remain semantic reducer states internally, but their child-facing presentation must become transient/non-blocking and auto-advance back to ACTIVE (or ROUND_COMPLETE when final), rather than requiring extra button taps.

## Acceptance target

The next preview must let User judge:
1. corrected typography direction
2. corrected brand color tokens
3. uninterrupted active-round interaction:
   correct -> voice/micro-feedback -> continue
   wrong -> voice/micro-feedback -> retry
   final 3/3 -> one celebration screen

No production asset claim is allowed.
