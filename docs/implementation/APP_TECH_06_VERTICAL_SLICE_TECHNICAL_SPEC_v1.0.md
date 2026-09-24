# APP-TECH-06 — Vertical Slice Technical Spec v1.0

Status: APPROVED WITH CONDITIONS
Date: 2026-09-24
Project: NamyKids App
Repository: HoaiNamPTH/Namykids-app

## 1. Purpose

Define the implementation contract for the first NamyKids production Vertical Slice without reopening approved Product, Architecture, Education, UX, Visual, Privacy or Quality decisions.

This document is the direct build handoff for Codex.

No production code is authorized by this document alone until this spec passes CMO audit.

## 2. Canonical dependencies

Must preserve:
- APP-PROD-01/02/03/04/05/06/08 — APPROVED
- APP-ARCH-01 v1.2 / APP-ARCH-02 v1.0 — APPROVED/CLOSED
- APP-TECH-03A Shared Account Boundary — PASS
- APP-TECH-03B Web Token Verification — PASS
- APP-TECH-03C App Schema Contract — PASS
- APP-TECH-03 Migration Gate — APPROVED/CLOSED
- APP-TECH-05A — PASS WITH CONDITIONS/CLOSED
- APP-TECH-05B — APPROVED WITH CONDITIONS/CLOSED
- APP-DES-03 — APPROVED / IMAGE-BASED VISUAL SOURCE OF TRUTH
- APP-DES-04 — APPROVED WITH CONDITIONS
- APP-UX-04 — APPROVED
- APP-EDU-06 — APPROVED

Legacy Figma:
- REJECTED / NON-CANONICAL / must not be used as visual source of truth.

## 3. Vertical Slice scope

Scope starts after a valid parent session can be established.

Required end-to-end slice:

1. App boot
2. Web Auth session restore/sign-in boundary
3. child binding resolve
4. entitlement resolve
5. device registration/check
6. Child World
7. enter Chữ cái & vần
8. start or resume first approved activity
9. instruction/orientation
10. active Alphabet Missing Letters — Drag & Place interaction
11. correct/incorrect/assisted feedback
12. Completion Commit
13. progress/resume projection update
14. offline/outbox recovery
15. reopen/resume
16. Parent Zone progress read
17. restricted/LIMITED behavior
18. child/account revoke behavior in test

Out of scope:
- full app content catalog implementation;
- second learning engine beyond what is needed for this slice;
- payment checkout;
- iOS Web-only commerce implementation;
- ads;
- virtual currency;
- production-wide social/marketing functionality;
- Web Parent Hub write features;
- legacy Web progress cutover decision.

## 4. First content unit lock

Canonical first-slice activity:
- subject: Chữ cái & vần
- canonical concept: **Alphabet Missing Letters — Drag & Place**
- audience baseline: **3–4 tuổi**
- learning intent: familiarization and remembering alphabet order through repeated play, not prior-knowledge testing
- baseline: **3 missing letters**
- progression: **2 → 3 → 4 → 5–6 missing letters**; 6–7 is not baseline
- interaction: drag letters from a shuffled tray into the correct missing positions
- refresh / “Lượt mới”: generate a new missing-letter set
- technical production engine mapping: **E02 DRAG_DROP**
- content config owns the exact letters missing in each round; no fixed legacy fixed-letter target/distractor set set is canonical
- session completion does not equal mastery

Superseded:
- legacy find-object mechanic Find-Object in Scene
- E01 SELECT as the primary first-slice engine
- fixed legacy fixed-letter target/distractor set target-distractor lock

Important:
The approved visual image may contain illustrative letter examples. They are visual examples only and must not recreate the superseded legacy fixed-letter target/distractor set rule.

## 5. Route map

Recommended Expo Router logical route contract:

- /(auth)
  - sign-in / session-recovery entry as required by existing account flow
- /(app)
  - child-world
  - subject/[subjectId]
  - activity/[activityId]
  - parent
  - restricted
  - recovery

Do not infer route names as API contracts. Route file naming may adapt to Expo Router conventions, but navigation semantics must preserve:

Child World → Subject → Instruction/Activity → Feedback/Completion → Subject/Home
Child World → Parent Zone → Child World
Child/Subject → Restricted → safe return

Guards:
- Auth Guard before protected app routes.
- ParentAccessGuard only where approved parent-only action needs it.
- entitlement gate before FULL content.
- engine never navigates directly.

## 6. Repo/module map

Use existing approved folders:

### src/navigation/
Owns:
- route guards;
- route params;
- parent/child route boundaries;
- safe recovery destinations.

Must not:
- write progress;
- mutate entitlement;
- contain game scoring.

### src/runtime/
Owns:
- Activity Player;
- GameSession reducer;
- runtime orchestration;
- session pinning;
- completion orchestration;
- transition between engine state and UI state.

Suggested internal modules:
- activity-player/
- session/
- completion/
- resume/

### src/engines/
Production engines only:
- E01 SELECT
- E02 DRAG_DROP
- E04 TRACE

For this slice:
- implement **E02 DRAG_DROP** to the extent required for Alphabet Missing Letters — Drag & Place.
- E01 SELECT and E04 TRACE remain approved production engines but are not the primary first-slice mechanic.
- do not expand into additional engine behaviors outside what this slice needs.

Engine rules:
- pure interaction logic;
- emits domain events;
- never writes DB;
- never calls navigation;
- never changes progress directly.

### src/content/
Owns:
- content release loading;
- content node/version parsing;
- config validation;
- asset manifest resolution;
- engine config mapping;
- approved content only.

### src/progress/
Owns:
- read models/projections consumed by UI;
- no direct canonical writes.

### src/sync/
Owns:
- durable local pending queue;
- retry/backoff;
- deduplication;
- reconciliation;
- dead-letter handling.

### src/device/
Owns:
- random installation ID;
- device registration client;
- max-two-device status presentation.

### src/data/
Owns:
- API/backend adapters;
- read repositories;
- Completion Commit client adapter;
- token/binding/entitlement integration adapters.

Screens and engines must not call Supabase tables directly.

## 7. Runtime contracts

### 7.1 Task start input

TaskStartParams:
- childId
- activityId
- activityVersion
- contentReleaseId
- engineType
- engineVersion optional
- entitlementRequirement
- resumePointer optional

Parent/user identity is derived from verified auth context, not trusted from arbitrary screen params.

### 7.2 Activity config

For first slice, config must minimally support:

- activityId
- activityVersion
- contentReleaseId
- engineType = E02_DRAG_DROP
- engineVersion
- instructionAudioAssetId
- instructionVisualAssetIds
- orderedSequenceId / sequence metadata
- visibleSequence
- missingPositions
- trayItems
- trayShuffleSeed or equivalent deterministic round seed where needed
- dropTargets
- roundDifficulty / missingCount
- refreshableRoundConfig
- candidate display metadata
- equal-salience / no-answer-cue constraints
- feedback audio/assets
- accessibility labels/equivalents
- requiresFull boolean
- completion rule reference
- education approval/version metadata

Config must not contain a hard-coded claim of mastery.

### 7.3 GameSession state

Preserve approved reducer states:

IDLE
→ INTRO
→ ACTIVE
→ CHECKING
→ FEEDBACK_POSITIVE / FEEDBACK_NEGATIVE
→ RETRY / ROUND_COMPLETE
→ COMPLETING
→ COMPLETED

Additional orchestration flags may exist outside reducer for:
- sync pending;
- offline queued;
- auth refresh;
- entitlement refresh;
- recovery.

Do not contaminate pure reducer with network/database side effects.

### 7.4 Domain events

Required events:
- Start
- Attempt
- HintUsed
- Completed
- Abandoned
- RetryRequested

For first slice, Attempt should carry only the minimum education/runtime evidence needed; do not log unnecessary raw child-answer telemetry outside canonical persistence.

## 8. Alphabet Missing Letters / E02 interaction contract

Round structure:
- ordered alphabet sequence with a configurable set of missing positions;
- baseline missingCount = 3 for the 3–4 age-band slice;
- progression may use 2, 3, 4, then 5–6 missing letters;
- tray order is shuffled;
- refresh / “Lượt mới” creates a new missing-position set;
- exact letters are content-driven, not hard-coded to legacy fixed-letter target/distractor set.

Interaction:
- drag a tray letter into a target gap;
- correct placement locks/acknowledges that placement according to content config;
- wrong placement returns gently or rejects without removing the challenge;
- random sweeping/lucky placement must not be treated as independent evidence;
- answer-revealing support marks evidence assisted=true;
- motor near-miss should not be classified as a knowledge error where technically distinguishable;
- engine emits semantic drag/drop result only;
- runtime owns persistence and navigation.

Visual/education guardrails:
- glyphs upright, fully visible, undistorted and unobscured;
- no correct-only glow/color/size/motion/proximity cue before response;
- drop targets large enough for the age band;
- refresh cannot silently change an in-progress round.

## 9. Completion Commit contract

Canonical write boundary:
public.commit_activity_completion(...)

Preserve audited 17-argument signature:
1. p_parent_user_id uuid
2. p_child_id uuid
3. p_completion_id uuid
4. p_release_id uuid
5. p_node_version_id uuid
6. p_attempt_id uuid
7. p_started_at timestamptz
8. p_source text
9. p_begin_snapshot jsonb
10. p_outcome text
11. p_score numeric
12. p_assisted boolean
13. p_completed_at timestamptz
14. p_result_payload jsonb
15. p_progress_status text
16. p_resume_payload jsonb
17. p_requires_full boolean

Rules:
- server-mediated;
- SECURITY INVOKER contract preserved;
- completion_id stable across retries;
- atomic Attempt + Result + Progress Projection + Resume/Outbox behavior;
- duplicate completion returns idempotent result;
- transaction failure produces zero partial canonical rows;
- wrong child fails;
- FULL-required + insufficient entitlement fails closed;
- UI does not directly perform canonical progress writes.

## 10. Auth / binding / entitlement

### 10.1 Identity
- mobile signs in against Web Supabase Auth;
- sends Web access token to trusted App backend;
- backend validates against Web Auth via getUser(token) baseline;
- verified user.id becomes parent_user_id;
- client-supplied parent_user_id is ignored.

### 10.2 Child
- requested child_id is untrusted until active app.identity_binding is verified;
- wrong/unbound child → 403 / zero writes.

### 10.3 Entitlement
- Web remains authority;
- App consumes cached snapshot only;
- stale/unknown entitlement → LIMITED;
- App cannot promote itself to FULL;
- trial/FULL state does not originate in game code.

### 10.4 Device
- installation ID = random UUID;
- no fingerprint;
- no ad ID;
- max 2 active App devices/account;
- Web sessions excluded from device count.

## 11. Local persistence

Local state must be separated into:

### Session snapshot
Contains:
- childId
- activityId/version
- contentReleaseId
- engineType/version
- semantic reducer state required for resume
- startedAt
- attemptId/completionId where applicable

Key must include:
- user/parent context
- child
- content release
- activity/version

### Pending completion/outbox
Must be durable before remote retry.

Contains only minimum data required to reconstruct Completion Commit.

Never store:
- auth token in arbitrary JSON store;
- parent email/phone;
- child nickname as technical key;
- payment data;
- advertising/device fingerprint data.

## 12. Offline contract

Must pass:

A. online start → online complete
B. online start → offline → complete → reconnect
C. online start → offline → kill app → reopen → reconnect
D. permitted cached start offline → complete → reconnect
E. duplicate retry storm
F. server committed but client missed response
G. content release changed while session active
H. auth expired before retry
I. entitlement downgraded before pending protected write
J. child/account revoked before queued write reaches backend

Expected:
- no duplicate canonical result;
- no lost completion that was safely queued;
- pinned release/version preserved;
- re-auth when needed;
- fail closed on entitlement;
- revoked child/account cannot commit new protected writes;
- child receives safe non-technical recovery UI.

## 13. Screen-state binding

Map APP-DES-04 states to technical presenters/view models:

S01 Child World:
- group availability read model
- entitlement-safe group state
- Parent Zone entry

S02 Subject Journey:
- node list/projection
- current/resume pointer
- lock state
- cached/offline state

S03 Instruction:
- approved instruction/audio assets
- no scored attempt yet unless Education config explicitly begins attempt here

S04 Active:
- reducer state ACTIVE
- E02 DRAG_DROP engine instance
- Missing Letters round config
- current missing positions + shuffled tray
- replay action
- refresh only at a valid round boundary

S05 Correct:
- CHECKING → FEEDBACK_POSITIVE → COMPLETING/ROUND_COMPLETE

S06 Retry:
- CHECKING → FEEDBACK_NEGATIVE → RETRY
- assisted state when hint reveals answer

S07 Completion:
- COMPLETED or child-safe queued acknowledgement
- decorative reward only

S08 Loading/Recovery:
- auth/content/entitlement/resume resolution

S09 Offline/Sync:
- queue state and recovery

S10 Parent Zone:
- projection/read models only
- no canonical progress mutation

S11 Restricted:
- LIMITED/unavailable content state
- no child commerce CTA

S12 Fatal Recovery:
- safe exit and diagnostic correlation ID only

## 14. Visual implementation contract

Visual source:
- exact user-approved NamyKids Soft CGI concept image from 2026-09-24.

Do NOT implement from:
- legacy Figma scaffold;
- rejected flat candidate;
- generated substitute with different mascot identity/style.

Implementation rules:
- official logo asset colors;
- Nami/Niko production raster art consistent with approved visual;
- Soft CGI/storybook scene assets;
- rounded child-friendly surfaces;
- image-led/voice-first child screens;
- calmer Parent Zone.

Concept-art corrections:
- illustrative letter examples → content-driven Missing Letters rounds; do not restore old legacy fixed-letter target/distractor set;
- +3 stars = decorative only;
- progress percentages only if real projection supports them;
- content counts only from approved content data;
- age/onboarding visual does not create a new Product requirement;
- bottom nav shown in concept does not override route contract.

## 15. Asset manifest

Create a versioned asset manifest for the slice.

Required categories:
- logo
- Nami poses
- Niko poses
- Child World background
- subject path background
- instruction scene
- active Missing Letters drag-and-place scene
- correct feedback
- retry feedback
- completion/reward
- Parent Zone decorative assets
- canonical alphabet glyph master set required by the approved content scope
- audio files
- utility icons

Each entry:
- stableAssetId
- version
- type
- file path/URI
- checksum if practical
- intended screen/state
- accessibility role
- preload priority
- source approval reference

Missing final asset may use DEV_PLACEHOLDER only in development.
DEV_PLACEHOLDER blocks final visual QA/release for that screen.

## 16. Audio implementation

Voice-over mandatory for child instructions.

Implement audio service with:
- play
- replay
- stop on route/session change
- sound-off behavior
- asset-version awareness
- failure callback

Sound-off:
- essential meaning must remain visually understandable.

No microphone permission is required for this slice.

## 17. Accessibility implementation

Required:
- 44x44 pt iOS practical minimum target
- 48x48 dp Android practical minimum
- larger child targets preferred
- semantic labels/roles/states
- logical focus
- no color-only state
- decorative art hidden from accessibility tree
- Parent Zone charts include text summaries

Missing Letters / E02 accessibility:
- provide a non-drag equivalent where the learning objective can be preserved;
- do not claim equivalence if exact spatial ordering cannot be represented faithfully for assistive technology;
- use an approved accessible alternative path where required by quality review.

## 18. Observability

Default:
- first-party/privacy-safe instrumentation preferred.

Allowed default diagnostic fields:
- build/app version
- platform/OS major
- route/screen code
- engine code/version
- content release/node version
- anonymous request/completion correlation ID
- error class/code
- queue state
- duration/performance timing

Forbidden:
- child name/nickname
- parent email/phone
- token/header
- precise location
- ad IDs
- hardware fingerprint
- raw recording
- session replay
- screenshots
- unapproved raw answer content

P0 events:
- completion commit failure
- idempotency conflict
- wrong-child auth
- binding/entitlement failure
- outbox dead-letter
- crash loop
- corrupt resume
- content/version incompatibility

Third-party crash/analytics SDK:
- not authorized by this spec;
- requires separate APP-TECH-05A compatibility verification.

## 19. Performance acceptance

Use APP-TECH-05B provisional budgets until first release-build baseline:

- target 60 FPS child interaction
- local touch → visible/audio acknowledgement p95 <= 100 ms
- cached activity transition p95 <= 700 ms
- cold launch p95 <= 4.0 s on representative mid-tier release hardware
- background resume p95 <= 1.5 s when no forced auth refresh

All values:
PROVISIONAL internal targets, not external facts.

After first measured baseline:
- calibrate only with documented device/build evidence.

## 20. Test plan

### Unit
- reducer transitions
- E02 drag/drop placement evaluation
- Missing Letters round/config schema
- hint/assisted semantics
- idempotency helpers
- resume serializer
- entitlement fail-closed helper
- redaction

### Integration
- verify-web-session adapter
- binding lookup
- entitlement refresh
- device registration
- Completion Commit adapter
- local outbox retry
- release pinning
- revocation

### Database
Existing canonical pgTAP:
- 52/52 must remain PASS

Any DB change:
- reset cleanly twice
- preserve security advisor
- preserve FK-index coverage
- no direct mobile writes

### E2E
1. valid session → Child World
2. Child World → Chữ cái & vần
3. start Missing Letters round
4. correct drag/place path
5. wrong placement → retry/return
6. assisted hint path
7. refresh / “Lượt mới” changes the missing set
7. completion commit
8. reopen → progress
9. incomplete → resume
10. Parent Zone read
11. LIMITED path
12. offline complete/reconnect
13. duplicate retry
14. wrong child
15. stale entitlement
16. device #3
17. revoke child/account

### Accessibility
- VoiceOver manual pass
- TalkBack manual pass
- touch target review
- contrast review
- focus order
- child-safe audio-off fallback

### Visual QA
Against approved image only:
- brand colors
- mascot identity/style
- Soft CGI scene style
- layout hierarchy
- no flat placeholder final art
- no superseded fixed-letter or legacy find-object mechanic leakage; Missing Letters visual behavior matches the approved interaction canon

## 21. Definition of Done — implementation

Vertical Slice implementation is DONE only when:

Architecture:
- screens/engines make zero direct protected-table writes
- engine does not navigate
- reducer pure
- runtime orchestrates completion

Auth/security:
- Web token validated server-side
- fake parent ignored
- wrong child zero writes
- secrets absent from mobile
- entitlement fail closed

Learning:
- Missing Letters — Drag & Place mapped to E02
- baseline 3 missing letters for 3–4
- progression 2→3→4→5–6 preserved
- tray shuffle + refresh behavior preserved
- no fixed legacy fixed-letter target/distractor set lock
- no answer cue
- assisted semantics correct
- voice instruction present
- session completion != mastery

Persistence:
- atomic completion
- idempotency
- resume
- offline outbox
- no duplicate progress
- release pinning

Visual:
- approved image is reference
- Figma ignored
- production Soft CGI assets present for release candidate
- no visual substitution

Quality:
- required tests pass
- no P0 issue
- no unresolved P1 without explicit waiver
- performance baseline captured
- accessibility core pass

Governance:
- no commerce implementation that resolves DC-APP-COMMERCE-001 silently
- no architecture reopen
- no legacy progress cutover without later Release/Cutover decision

## 22. Implementation order for Codex

Run in small auditable increments:

Build 1 — framework/runtime skeleton
- Expo/TypeScript/bootstrap if not already present
- route skeleton
- domain types
- reducer
- E02 DRAG_DROP interface
- content schema
- local persistence abstractions
- no final visual polish yet

Build 2 — protected integration
- Web Auth session adapter
- verify-web-session client
- binding/entitlement/device
- Completion Commit adapter
- outbox/resume
- unit/integration tests

Build 3 — Vertical Slice UI + approved asset integration
- S01–S12 required subset
- Missing Letters — Drag & Place activity
- audio
- Parent Zone read
- offline/recovery
- approved Soft CGI production assets
- accessibility

Build 4 only if evidence requires
- defect correction from audit
- no scope expansion

Goal:
2–3 primary implementation passes; a fourth pass is exception-only, not planned patchwork.

## 23. Forbidden implementation shortcuts

Do not:
- recreate final UI from rejected Figma;
- restore legacy fixed-letter target/distractor set or any fixed target-distractor set from superseded decisions or concept art;
- hard-code fake progress percentages;
- create second Auth account;
- write Web commerce truth into App;
- expose service role;
- call protected tables directly from screens/engines;
- generate device fingerprint;
- add analytics SDK without approval;
- add paywall/upgrade link before commerce decision;
- treat stars as currency;
- mark session completion as mastery;
- switch content release during active session;
- bypass outbox/idempotency;
- create a parallel progress store.

## 24. Open conditions / non-blockers

Open but not blocking this Technical Spec:
1. DC-APP-COMMERCE-001
2. third-party observability SDK eligibility
3. exact guardian-verification method
4. exact minOS/device matrix
5. legacy Web progress cutover
6. final production asset export/file packaging

These become blockers only at the gate where they are decision-critical.

## 25. CMO audit & decision

Audit result: PASS.

Checked:
- no Product/Architecture/UX/Education decision was silently reopened;
- Missing Letters → E02 mapping stays within approved runtime boundaries;
- superseded legacy find-object mechanic + legacy fixed-letter target/distractor set decisions are excluded;
- Web Auth, child binding, entitlement and max-two-device rules are preserved;
- Completion Commit signature/idempotency/outbox/resume contracts are preserved;
- legacy Figma is explicitly excluded as visual authority;
- APP-TECH-05A privacy/store constraints and APP-TECH-05B quality gates are carried forward;
- open commerce/guardian/minOS/cutover items are correctly deferred and do not block this spec.

CMO status:
APPROVED WITH CONDITIONS

Conditions:
- build may start only from this spec plus canonical dependencies;
- final visual QA requires production assets matching approved image;
- no iOS commerce behavior may be implemented that presumes DC-APP-COMMERCE-001 resolved;
- APP-TECH-05B quality gates remain mandatory.

No new User Decision Owner input is required before implementation kickoff.
