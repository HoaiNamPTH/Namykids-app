# APP-QA-01 — Vertical Slice 4-Layer Audit Brief

Status: IN PROGRESS
Date: 2026-09-30
Project: NamyKids App
Baseline under audit:
- branch: codex/app-build-02-pass1
- commit: 72f56c21fb2f68278f96ca9d4f10d74802bf44ff

## 1. Gate objective

Determine whether the NamyKids first Vertical Slice is good enough to proceed to:
APP-BASELINE-01 — User Acceptance + Foundation Baseline Lock.

This Gate does NOT:
- scale curriculum;
- publish production content;
- resolve commerce;
- replace missing production assets;
- change approved Product/Education/UX/Visual baselines.

## 2. Required audit layers

### Layer A — Code / Runtime
Owner: CMO/ChatGPT audit with Codex evidence

Audit:
- auth/session bootstrap
- verified child ownership/binding
- entitlement gating
- published content pinning
- GameSession reducer
- completion commit
- stable completion_id
- durable outbox
- offline/retry/resume
- progress/read models
- device/privacy/security boundaries
- migration/RPC scope
- dependency/scope drift
- tests/advisors/performance evidence

### Layer B — Visual / Interaction
Owner: Antigravity proposes audit; CMO approves/rejects findings

Canonical visual authority:
- approved Soft CGI / Premium Stylized 3D Cartoon source
- NOT legacy Figma

Audit:
- S01–S12 hierarchy/state semantics
- E02 interaction behavior
- visual hierarchy and child usability
- touch targets
- scroll/drag conflict
- non-color-only cues
- Parent Zone tone
- DEV_PLACEHOLDER inventory
- deviations from approved Soft CGI source

Important:
Current Final Visual QA may remain BLOCKED_BY_ASSET.
That alone does not invalidate code/runtime readiness if placeholders are explicitly isolated.

### Layer C — Education
Owner: Gemini
CMO does NOT replace specialist education review.

Audit canonical first slice:
Alphabet Missing Letters — Drag & Place
- baseline age 3–4
- familiarization with alphabet order
- baseline 3 missing
- progression 2 → 3 → 4 → 5–6
- shuffled tray
- refresh/new round semantics
- gentle retry
- answer-revealing support => assisted
- random/lucky behavior not independent evidence
- session completion != mastery
- no fixed timer/count hint rule
- no deprecated find-object / fixed-letter target-distractor behavior

Gemini must classify:
PASS / REVIEW / HIGH
and provide correction only for REVIEW/HIGH.

### Layer D — Policy / Quality
Owner: CMO/ChatGPT

Audit:
- no service secret in mobile
- no direct protected DB writes
- Web token verified server-side
- child binding enforced
- stale/unknown entitlement fail-closed for FULL-required content
- no child paywall/commerce
- no prohibited telemetry/identifier collection
- no unapproved SDK/permission drift
- privacy-safe persistence/logging
- accessibility gates
- secure storage failure handling
- no remote apply/deploy drift
- no unresolved P0/P1 hidden by placeholder status

## 3. Evidence classes

Every finding must be tagged:
- VERIFIED FACT
- DERIVED-INFERENCE
- ASSUMPTION
- UNKNOWN
- VALIDATION REQUIRED

Do not convert:
- local test fixture -> production approved content
- DEV_PLACEHOLDER -> final visual approval
- Codex-reported command result -> independently rerun evidence
- document statement -> user approval unless explicitly approved

## 4. Severity

P0:
- wrong-child access
- secret leakage
- broken atomic completion
- duplicate/lost canonical progress
- fail-open FULL
- content release switch mid-session
- unrecoverable session corruption
- prohibited privacy behavior

P1:
- repeatable core-flow failure
- broken offline recovery
- core accessibility blocker
- severe interaction failure
- broken max-two-device behavior
- required policy guard missing

P2:
- bounded non-core defect
- copy/state-code inconsistency
- non-final placeholder polish

## 5. Known carry-forward conditions entering QA

VALIDATION REQUIRED:
- real non-production Web token -> runtime-bootstrap -> Child World E2E
- real non-production identity binding
- native-device cold launch/resume
- VoiceOver/TalkBack on device
- production raster/audio assets
- Final Visual QA

KNOWN MINOR:
- standalone /restricted route stateCode S08 instead of S11, while canonical S11 semantics exist in activity route

These must be reassessed for Gate criticality; do not automatically block APP-QA-01.

## 6. Gate decision criteria

PASS:
- no P0/P1
- all 4 layers sufficiently evidenced
- no material unresolved contradiction
- no education REVIEW/HIGH
- visual placeholders explicitly isolated and do not masquerade as final

PASS WITH CONDITIONS:
- no P0/P1
- bounded validation remains for later device/integration/final asset gate
- conditions cannot change current foundation architecture/learning choice

REVISION REQUIRED:
- a defect can change or invalidate the Foundation Baseline
- education REVIEW/HIGH remains
- core interaction/runtime contradiction remains

BLOCKED:
- evidence required to judge the foundation cannot be obtained at all

## 7. Output contract

Produce one consolidated:
NamyKids_Vertical_Slice_Audit_Report_v1.0

Sections:
1. CMO decision
2. Gate status
3. verified facts
4. Layer A — Code/runtime
5. Layer B — Visual/interaction
6. Layer C — Education
7. Layer D — Policy/quality
8. P0/P1/P2 findings
9. deferred validation
10. what NOT to change
11. revision memo, if required
12. next allowed step

## 8. Specialist boundaries

Gemini:
Education review only.

Antigravity:
Visual/interaction review only.

Codex:
Provide evidence/fix approved technical defects only.

CMO:
Consolidates, challenges, approves/rejects, and makes final Gate decision.

## 9. Current status

APP-QA-01:
IN PROGRESS

No User approval is required to begin this Gate.
User is required only if:
- a material Product/Education/UX/Visual decision must change;
- final User Acceptance is reached at APP-BASELINE-01.
