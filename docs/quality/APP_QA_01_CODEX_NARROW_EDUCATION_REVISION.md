# APP-QA-01 — Codex Narrow Education Revision Directive

Use baseline branch codex/app-build-02-pass1.

Read:
- docs/quality/NAMYKIDS_APP_QA_01_CONSOLIDATED_REVISION_MEMO_v1.0.md

Implement only the two approved education-integrity corrections:
1. trial-and-error independent-evidence integrity
2. semantic Hint eligibility

Do not expand scope.

### A. Trial-and-error evidence

Current behavior where evaluateDrop can return independentlyAssessable=true for a later correct attempt after previous wrong placements must be corrected at orchestration/session level.

Required:
- keep gentle retry UI unchanged.
- track whether an item and/or target has participated in a wrong placement during the current round.
- a later correct placement is independent evidence only when:
  - answer was not revealed;
  - the successful item has no prior wrong placement in the round;
  - the successful target has no prior wrong placement in the round.
- trial-and-error completion still counts as task completion, but not independent evidence.
- preserve enough assessment summary in existing result payload/session state to distinguish independent vs trial-and-error evidence.
- do not create a mastery claim.
- no DB migration unless impossible; STOP if you believe migration is necessary.

### B. Semantic Hint eligibility

Current Hint action is available immediately in ACTIVE; fix this.

Required:
- Hint unavailable at fresh ACTIVE.
- Unlock Hint after a genuine semantic struggle event: at least one incorrect placement in current round.
- Do not use elapsed time.
- Do not require exactly N errors.
- Do not implement a fixed counter threshold.
- Existing revealHint behavior remains answer-revealing => assisted=true and independentlyAssessable=false.
- Reset Hint eligibility appropriately on a new round/restart.

### Tests required

Add regression tests proving:
- clean first-attempt correct remains independent.
- wrong item then correct same item is not independent.
- wrong target then correct target is not independent.
- revealed Hint success is assisted and non-independent.
- Hint unavailable on fresh ACTIVE.
- a genuine wrong placement unlocks Hint.
- no timer/count-based trigger exists.
- completion payload/result preserves assessment distinction.
- no regression in completion/outbox/session pin.

Then run:
typecheck
lint
npm test
quality:static
build:web
git diff --check

Commit and push same branch.
Return commit SHA and focused diff summary.

Do not:
- merge main
- deploy remote DB/Edge
- add package
- redesign screens
- change E02 mechanic
- change baseline missing count
- alter entitlement/auth/content-pin architecture
- touch production asset pipeline
