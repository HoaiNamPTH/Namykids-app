# NamyKids Vertical Slice — Final Build Package v1.0

Status: CANDIDATE FOR USER APPROVAL
Date: 2026-09-25
Repository: HoaiNamPTH/Namykids-app
Build task: APP-BUILD-01

## 1. Purpose

This is the single canonical implementation handoff for Codex to build the first NamyKids App Vertical Slice.

Codex MUST NOT assemble its own baseline from historical documents, legacy Figma, prior screenshots, older mechanics, or concept-art text.

If this package conflicts with an older artifact, this package + its listed canonical authorities win unless a newer User-approved Change Control exists.

No implementation begins until User approves this package.

## 2. Canonical source order

Use this precedence:

1. User-approved Product decisions
2. Current Education authority / APP-EDU-06
3. Current UX authority / APP-UX-04
4. User-approved Soft CGI Visual Source
5. APP-DES-04 non-Figma Interaction & Screen-State Spec
6. Approved Architecture / Auth / Schema / Privacy / Quality contracts
7. APP-TECH-06 Technical Spec
8. This build package as implementation orchestration
9. Code

Code never becomes a new source of truth by itself.

## 3. Current canonical decisions

### Product
- NamyKids App serves children 2–6.
- Vietnam / Vietnamese V1.
- One account = one child.
- Shared Web/App account.
- Web is identity + parent/child + commerce/entitlement authority.
- App is learning-runtime/progress authority.
- Free download.
- LIMITED + FULL entitlement model.
- No ads.
- No virtual currency/reward economy.
- Max 2 active App devices/account.
- Parent Zone exists.
- No mandatory Parent PIN baseline.
- Web-primary commerce remains subject to open iOS commerce Decision Challenge.

### First Vertical Slice
Flow:
valid account/session
→ Child World
→ Chữ cái & vần
→ first approved learning unit
→ instruction
→ interaction
→ feedback/retry/hint
→ completion
→ progress
→ reopen/resume
→ Parent Zone

### Education mechanic — CURRENT CANON
Alphabet Missing Letters — Drag & Place

Audience baseline:
- 3–4 tuổi

Learning intent:
- familiarization with alphabet order through repeated play;
- not a prior-knowledge test;
- session completion != mastery.

Challenge:
- baseline = 3 missing letters
- progression = 2 → 3 → 4 → 5–6 missing letters
- 6–7 missing letters is not baseline

Interaction:
- drag letters from shuffled tray into missing positions
- wrong placement returns/retries gently
- Refresh / “Lượt mới” creates a new missing-position set
- exact missing letters are content-driven
- answer-revealing support = ASSISTED
- random/lucky drag behavior must not be treated as independent mastery evidence

Technical engine mapping:
- E02 DRAG_DROP

### Visual — CURRENT CANON
Visual Source of Truth:
- exact user-approved NamyKids Soft CGI concept image approved 2026-09-24

Locked:
- official NamyKids logo colors
- Premium Stylized 3D Cartoon / Soft CGI
- Nami = brown bear
- Niko = purple rhino
- nature/storybook environment
- rounded toy-like surfaces
- image-led + voice-first child UI
- calmer Parent Zone
- cheerful but non-overstimulating feedback

Legacy Figma:
- NON-CANONICAL
- REJECTED as final visual implementation source
- must not be used to recreate final UI

Concept-art text/letters:
- illustrative only
- do not override Education / UX / Product

## 4. Canonical repository documents

Use these active repo files:

### Architecture / integration
- docs/architecture/REPO_MAPPING_v1.0.md
- docs/architecture/SHARED_ACCOUNT_CROSS_PROJECT_BOUNDARY_v1.0.md
- docs/architecture/WEB_TOKEN_VERIFICATION_CONTRACT_v1.0.md

### Database
- docs/database/APP_SCHEMA_CONTRACT_v1.0.md
- docs/database/MIGRATION_TEST_PLAN_v1.0.md
- supabase/migrations/20260921145611_namykids_app_runtime_foundation.sql
- supabase/tests/app_runtime_foundation.sql
- supabase/functions/verify-web-session/index.ts

### Quality
- docs/quality/APP_TECH_05B_QUALITY_STRATEGY_v1.0.md

### Design / interaction
- docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md
  - active cleaned version
  - current active content contains Missing Letters / E02
  - legacy mechanic labels are not canonical

### Technical implementation
- docs/implementation/APP_TECH_06_VERTICAL_SLICE_TECHNICAL_SPEC_v1.0.md
  - current cleaned version
  - current implementation authority for this slice

## 5. Canonical external/non-repo authorities

Where these are not in repo, treat the following as authority by project governance / Master Sheet:

- APP-PROD-01 Product Vision
- APP-PROD-02 Account / entitlement decisions
- APP-PROD-03 MVP scope
- APP-PROD-04 App/Web boundary
- APP-PROD-05 Vertical Slice scope
- APP-PROD-06 Platform/business model
- APP-PROD-08 Content Ops
- APP-EDU-05 Language + Audio + Instruction Canon
- APP-EDU-06 current Alphabet Missing Letters education decision
- APP-UX-02 Parent Flow
- APP-UX-03 Kid Flow
- APP-UX-04 current Vertical Slice UX loop
- APP-DES-03 approved Soft CGI visual image
- APP-TECH-05A child safety/privacy/store constraints

If a repo artifact appears to conflict with these active authorities:
STOP and report the conflict.
Do not “pick the more technical one.”

## 6. Repo implementation boundaries

Approved structure:

- src/runtime/
  - Activity Player
  - GameSession reducer
  - completion orchestration
  - session pinning
  - resume orchestration

- src/engines/
  - E01 SELECT
  - E02 DRAG_DROP
  - E04 TRACE
  - first slice uses E02 only

- src/content/
  - release/config parsing
  - schema validation
  - asset manifest resolution

- src/progress/
  - read models/projections only

- src/navigation/
  - route guards
  - route params
  - safe recovery

- src/sync/
  - durable outbox
  - retry/backoff
  - dedupe/reconciliation
  - dead letter

- src/device/
  - random installation ID
  - device registration

- src/data/
  - backend/RPC/read adapters

Forbidden:
- direct protected-table writes from screens
- direct protected-table writes from engines
- engine-owned navigation
- duplicate progress store
- App-owned commerce truth
- second Auth account
- device fingerprint
- IDFA/AAID
- child PII as technical device ID

## 7. Auth / identity / entitlement contract

### Identity
- Mobile authenticates against Web Supabase Auth.
- Mobile sends Web bearer token to trusted App backend.
- Backend verifies via Web Auth getUser(token) baseline.
- Verified user.id = parent_user_id.
- Client parent_user_id is untrusted/ignored.

### Child binding
- child_id is untrusted until active App identity binding is checked.
- wrong child → 403 / zero protected writes.

### Entitlement
- Web is authority.
- App may cache snapshot.
- stale/unknown → LIMITED.
- App never promotes itself to FULL.
- game code never creates trial/FULL state.

### Device
- random installation UUID only.
- max 2 active App devices/account.
- Web sessions excluded.

## 8. Runtime state contract

GameSession reducer remains pure.

Canonical states:

IDLE
→ INTRO
→ ACTIVE
→ CHECKING
→ FEEDBACK_POSITIVE / FEEDBACK_NEGATIVE
→ RETRY / ROUND_COMPLETE
→ COMPLETING
→ COMPLETED

Network/auth/sync state stays outside pure reducer where practical.

Required events:
- Start
- Attempt
- HintUsed
- Completed
- Abandoned
- RetryRequested

## 9. First-slice activity config

Minimum config:

- activityId
- activityVersion
- contentReleaseId
- engineType = E02_DRAG_DROP
- engineVersion
- instructionAudioAssetId
- instructionVisualAssetIds
- orderedSequenceId / alphabet-sequence metadata
- visibleSequence
- missingPositions
- missingCount
- trayItems
- trayShuffleSeed or deterministic round seed if needed
- dropTargets
- refreshableRoundConfig
- feedback assets/audio
- accessibility metadata
- requiresFull
- completion rule
- education approval/version metadata

Do not hard-code a fixed letter set as the education canon.

## 10. Missing Letters interaction rules

- baseline missingCount = 3 for 3–4
- progression may use 2, 3, 4, then 5–6
- tray shuffled
- “Lượt mới” changes missing-position set
- Refresh cannot mutate an in-progress round silently
- correct placement acknowledges/locks according to config
- wrong placement returns/rejects gently
- no answer-only visual cue before response
- no random/lucky placement counted as independent evidence
- answer-revealing hint sets assisted=true
- motor near-miss should not automatically become knowledge error where technically distinguishable
- drop targets age-appropriate and accessibility-safe

## 11. Completion Commit

Use canonical RPC:

public.commit_activity_completion(...)

Preserve exact 17-argument audited contract from APP-TECH-06 / migration.

Rules:
- stable completionId across retries
- atomic Attempt + Result + Progress Projection + Resume/Outbox
- idempotent duplicates
- failed transaction = zero partial canonical rows
- wrong child rejected
- insufficient FULL entitlement fails closed
- screen/engine never performs canonical DB writes directly

## 12. Offline / resume contract

Must support at minimum:

A. online start → online complete
B. online start → offline → complete → reconnect
C. offline during session → app kill → reopen → reconnect
D. allowed cached offline start
E. duplicate retry storm
F. server committed but client missed response
G. new content release while active session is pinned
H. auth expiry before retry
I. entitlement changes before pending protected write
J. child/account revoked before queued write

Required outcome:
- no duplicate canonical progress
- no silent data loss after durable queue
- no cross-child mix
- no content release switch mid-session
- revoked identity cannot complete protected new writes
- stale entitlement never becomes FULL

## 13. Screen/state contract

Implement APP-DES-04 states:

S01 Child World
S02 Subject Journey
S03 Instruction
S04 Missing Letters active round
S05 Correct feedback
S06 Retry/incorrect
S07 Completion/reward
S08 Loading/recovery
S09 Offline/sync pending
S10 Parent Zone
S11 Restricted/unavailable
S12 Safe error recovery

Do not copy legacy Figma layouts.

Use approved visual image + screen semantics.

## 14. Audio

Voice-over mandatory for child instruction.

Required:
- instruction
- replay
- correct feedback
- gentle retry
- hint/support
- completion

No microphone permission needed in this slice.

Sound-off must not remove essential meaning.

## 15. Visual asset contract

Required before final visual QA:
- official NamyKids primary logo
- production Nami assets matching approved visual
- production Niko assets matching approved visual
- Child World scene/background
- subject scene/path
- Missing Letters activity scene
- feedback/retry/completion assets
- Parent Zone visuals
- canonical alphabet glyph master set
- utility icons
- audio files
- versioned asset manifest

DEV_PLACEHOLDER:
- allowed only during development
- must be visibly/semantically marked in manifest
- blocks final visual QA for that screen

Forbidden final substitutions:
- emoji mascot
- flat placeholder mascot
- random stock cartoon
- rejected Figma primitive drawings
- newly generated mascot that changes approved identity/style

## 16. Accessibility

Required:
- iOS practical target >= 44x44 pt
- Android practical target >= 48x48 dp
- larger child targets preferred
- semantic labels / roles / states
- logical focus
- no color-only critical state
- decorative art excluded from accessibility tree
- Parent Zone data visualizations have text summary

Missing Letters:
- provide a non-drag accessible equivalent where the learning objective can be preserved
- do not falsely claim identical assessment if spatial-order behavior cannot be represented equivalently

## 17. Privacy-safe observability

Preferred baseline:
- first-party telemetry

Allowed:
- app/build version
- OS major/platform
- route/screen code
- engine/version
- content release/version
- anonymous correlation/completion ID
- error class
- queue state
- performance timing

Forbidden:
- parent email/phone
- child name/nickname
- auth token/header
- precise location
- ad identifiers
- hardware fingerprint
- raw audio/image recording
- session replay
- auto screenshots
- unapproved raw answer content

No third-party analytics/crash SDK without separate policy review.

## 18. Quality gates

APP-TECH-05B remains mandatory.

P0 release blockers include:
- lost or duplicate canonical progress
- wrong-child access
- secret leakage
- fail-open FULL
- broken atomic completion
- unrecoverable resume corruption
- content release switch mid-session
- ignored revocation/deletion
- core child flow inaccessible without approved alternative

P1:
- repeatable core crash
- severe interaction lag
- failed offline recovery
- core accessibility failure
- prohibited telemetry
- broken max-two-device behavior
- required parental gate missing

## 19. Provisional performance targets

Until measured baseline:
- target 60 FPS
- local child input → visible/audio acknowledgement p95 <= 100 ms
- cached activity transition p95 <= 700 ms
- cold launch p95 <= 4.0 s
- background resume p95 <= 1.5 s when no forced auth refresh

These are PROVISIONAL internal targets.

## 20. Required tests

### Static
- format/lint/typecheck
- secret scan
- prohibited permission/identifier scan
- no screen/engine direct writes
- no duplicate progress store

### Unit
- reducer
- E02 drag/drop logic
- Missing Letters config
- retry/hint/assisted
- resume serialization
- idempotency helper
- entitlement fail-closed
- redaction

### Integration
- Web token verification
- child binding
- entitlement refresh
- device registration
- Completion Commit adapter
- local outbox/retry
- release pinning
- revocation

### Database
- existing canonical pgTAP = 52/52 PASS
- any DB change must preserve migration reset/security/FK-index gates

### E2E
- session → Child World
- enter Chữ cái & vần
- start Missing Letters
- correct drag
- wrong drag → retry
- assisted hint
- Lượt mới changes missing set
- completion
- reopen/progress
- incomplete/resume
- Parent Zone
- LIMITED
- offline/reconnect
- duplicate retry
- wrong child
- stale entitlement
- device #3
- revoke child/account

### Visual QA
Compare against approved Soft CGI image only.
Do not compare against rejected Figma.

## 21. Codex implementation plan

### Build Pass 1 — Foundation
- Expo/React Native/TypeScript bootstrap as needed
- route skeleton
- domain types
- reducer
- E02 interface
- content schema
- local persistence abstractions
- unit tests
- no final visual polish

### Build Pass 2 — Protected integration
- Web Auth session adapter
- verify-web-session client
- binding
- entitlement
- device
- Completion Commit
- outbox
- resume
- integration tests

### Build Pass 3 — Vertical Slice UI
- S01–S12 required subset
- Missing Letters drag/drop
- audio
- Parent Zone read
- offline/recovery
- approved visual asset integration
- accessibility
- E2E + performance baseline

### Build Pass 4 — Exception only
Only if audit evidence identifies remaining defects.
No scope expansion.

Target:
2–3 primary build passes.

## 22. Codex STOP rules

STOP and report instead of guessing if:
- Product/Education/UX/Visual/Technical canon conflict
- current file references a superseded mechanic
- exact approved visual asset is missing and implementation would require inventing final art
- Auth authority cannot be preserved
- Completion Commit contract would need a schema change
- commerce behavior would resolve DC-APP-COMMERCE-001 implicitly
- a third-party SDK is required
- a new permission is required
- a new Product decision is required
- a DB migration outside approved scope is needed
- legacy Web progress cutover is required

## 23. Forbidden/deprecated inputs

Do NOT use as implementation authority:
- legacy Figma scaffold
- rejected flat Hi-Fi candidate
- any historical fixed-letter target/distractor first-slice mechanic
- any historical find-object first-slice mechanic
- concept-art text/numbers as factual content source
- old Web learning/game routes as App runtime architecture
- duplicate Web progress as writable App truth
- old mascot variants marked RETIRE
- legacy generic logo marked RETIRE

## 24. Open conditions that do not block this build package

- DC-APP-COMMERCE-001
- exact guardian verification method
- third-party analytics/crash SDK eligibility
- final minOS/device QA list
- legacy Web progress cutover
- production packaging/export of final raster assets

These become blockers only when the build/release task reaches them.

## 25. Required Codex completion report

Codex must return one structured report containing:

1. branch
2. HEAD commit
3. clean/dirty working tree
4. files added/changed
5. architecture deviations = NONE or explicit
6. tests run + pass/fail counts
7. typecheck/lint/build result
8. database migration status
9. pgTAP result
10. auth/binding/entitlement tests
11. Completion Commit/idempotency tests
12. offline/outbox/resume tests
13. device-limit tests
14. accessibility checks
15. performance baseline
16. visual asset status
17. placeholders remaining
18. open blockers
19. exact next action
20. explicit statement that legacy Figma / deprecated mechanics were not used

## 26. Definition of Done for APP-BUILD-01

This package is ready for User approval when:
- one canonical source order is explicit
- current Missing Letters / E02 mechanic is explicit
- legacy mechanic/Figma are forbidden
- visual authority is explicit
- architecture/auth/schema/privacy/quality are included
- Codex build order is explicit
- STOP rules are explicit
- completion report contract is explicit
- no critical unresolved decision is hidden

## 27. Candidate decision

Recommended:
USER APPROVAL

After User approval:
APP-BUILD-01 = CLOSED
→ APP-BUILD-02 / Codex kickoff may begin according to the Master Plan.

No Codex implementation should begin before that approval.
