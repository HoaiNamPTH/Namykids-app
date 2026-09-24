# APP-TECH-05B — Quality, Test, Accessibility, Performance, Offline & Observability Strategy v1.0

Status: CANDIDATE FOR CMO AUDIT
Date: 2026-09-24
Repository: HoaiNamPTH/Namykids-app
Depends on:
- APP-ARCH-01 v1.2 / APP-ARCH-02 v1.0 — APPROVED/CLOSED
- APP-TECH-03 — Migration Gate APPROVED/CLOSED
- APP-TECH-04 — completed baseline
- APP-TECH-05A — PASS WITH CONDITIONS/CLOSED
- APP-PROD-05 — Vertical Slice contract
- APP-PROD-08 — Content Ops contract

## 1. Decision / purpose

This document defines the quality contract that future NamyKids App implementation must satisfy before Vertical Slice, integration, and release approval.

It does NOT:
- implement product features;
- reopen APP-ARCH decisions;
- decide the open iOS commerce challenge DC-APP-COMMERCE-001;
- invent market benchmarks where no NamyKids baseline exists;
- approve third-party analytics/crash SDKs.

Quality objective:
> A child must be able to start, complete, recover, resume, and repeat an approved learning activity without lost progress, duplicate progress, unsafe data collection, inaccessible core interaction, or silent failure.

## 2. Evidence classification

### VERIFIED FACT
- React Native targets native-grade smoothness and documents 60 FPS as the normal performance target; a 60 Hz frame budget is ~16.67 ms.
- Android quality guidance uses minimum 48dp touch targets and 4.5:1 contrast for smaller text / 3:1 for large text and graphics.
- Apple UI guidance recommends at least 44x44 pt hit targets.
- Apple VoiceOver guidance requires visible/interactive elements to be discoverable and operable with VoiceOver; complex gestures such as drag/drop need an accessible equivalent.
- WCAG 2.2 AA includes a non-drag alternative for functionality that requires dragging and minimum target-size guidance.
- APP-TECH-05A constrains tracking, child identifiers, permissions, parental gates and SDK use.

### DERIVED INFERENCE
Because NamyKids serves children aged 2–6 and includes tap/drag/trace activities, accessibility, immediate feedback, recovery and accidental-input resistance are release-quality requirements, not optional polish.

### ASSUMPTION / PROVISIONAL
Numeric startup/latency/performance budgets in this document are internal acceptance targets until the first release-build baseline is measured on representative hardware. They are not claimed as external industry facts.

## 3. Quality principles

1. Test architecture invariants before visual polish.
2. No screen or engine may bypass the approved runtime/write boundaries.
3. Child progress must never be duplicated or silently lost.
4. Offline behavior must fail safe and recover deterministically.
5. Accessibility must be designed into engines, not added after content completion.
6. Observability must not become child tracking.
7. Performance is tested in release/profile builds, not judged from dev mode.
8. One failed P0 invariant blocks release regardless of visual readiness.
9. Exact threshold changes require evidence from profiling, not preference.
10. Quality gates are cumulative: later gates do not erase earlier requirements.

## 4. Test pyramid

### L0 — Static / contract checks
Run on every PR:
- TypeScript typecheck.
- formatting/lint.
- dependency/config validation.
- content/config schema validation.
- no forbidden production engine codes outside E01/E02/E04.
- secret scan.
- prohibited permission scan:
  - AD_ID absent;
  - precise location absent unless later explicitly approved;
  - no hardware fingerprint logic.
- no direct Supabase writes from screens/engines.
- no duplicated progress persistence layer.
- no payment/paywall code before commerce decision.

Release blocker:
- any architecture-forbidden pattern.

### L1 — Unit tests
Primary targets:
- GameSession reducer/state transitions.
- engine input validation.
- scoring/result normalization.
- retry/hint rules.
- entitlement decision helpers.
- release/version pinning.
- local queue/outbox state.
- deduplication/idempotency helpers.
- resume-pointer serialization/deserialization.
- redaction/logging helpers.
- accessibility-label construction for dynamic content.

Required:
- deterministic tests;
- no network;
- no clock/random dependency without injected seams.

Release blocker:
- failure in reducer, idempotency, release pinning, entitlement fail-closed, or redaction tests.

### L2 — Integration tests
Test boundaries, not UI appearance:
- Web token verification adapter.
- App backend binding lookup.
- Completion Commit client adapter.
- entitlement refresh/fail-closed.
- local queue -> remote retry.
- content release loading and immutable-session pin.
- device registration max-two behavior.
- deletion/revocation propagation.
- navigation guards:
  - Auth Guard;
  - ParentAccessGuard;
  - protected FULL activity.

Required failure cases:
- expired/corrupted token;
- wrong child;
- stale entitlement;
- remote timeout;
- duplicate completion;
- app process killed during queued completion;
- release changes while a session is active.

### L3 — Database / contract tests
Existing APP-TECH-03 canonical pgTAP suite remains mandatory.
Current baseline:
- 52/52 pgTAP PASS.

Future DB migrations must:
- preserve all existing tests;
- add tests for any new invariant;
- reset cleanly twice;
- introduce no material security advisor finding;
- introduce no unindexed required FK;
- preserve zero direct mobile writes to protected runtime tables.

### L4 — End-to-end tests
Minimum Vertical Slice E2E:
1. sign in;
2. resolve child/binding;
3. enter Child World;
4. enter Chữ cái & vần;
5. start approved activity;
6. perform interaction;
7. receive feedback;
8. complete;
9. persist;
10. close/reopen;
11. confirm progress;
12. confirm resume when incomplete;
13. open Parent Zone;
14. verify LIMITED/FULL boundary.

Critical E2E variants:
- online happy path;
- start online -> lose network -> complete -> reconnect;
- duplicate submit/retry;
- app kill before sync;
- wrong-child access;
- stale/expired entitlement;
- new content release published mid-session;
- device #3 rejected;
- deletion/revocation blocks further writes.

Release blocker:
- any E2E path causes lost progress, duplicate result, wrong-child exposure, silent FULL upgrade, or orphaned active session.

## 5. Accessibility contract

### 5.1 Target baseline
Use native mobile accessibility plus WCAG 2.2 AA concepts where applicable.

Minimum interaction sizing:
- iOS: 44x44 pt minimum practical hit area.
- Android: 48x48 dp minimum practical touch target.
- For child-facing controls, prefer larger than platform minimum when layout allows.

Contrast:
- small text: >= 4.5:1.
- large text / essential graphics / UI state: >= 3:1.
- never communicate correctness, selection or error by color alone.

### 5.2 Screen reader / semantic requirements
Every core flow must pass:
- VoiceOver on iOS;
- TalkBack on Android.

Interactive controls require:
- accessible label;
- correct role/state;
- logical focus order;
- no focus trap;
- no invisible/background focus behind modal;
- state-change announcement where needed;
- no duplicate/redundant labels.

Decorative images:
- excluded from accessibility tree.

Learning images carrying meaning:
- meaningful alternative label or equivalent auditory instruction.

### 5.3 Drag, trace and gesture accessibility
E02 DRAG_DROP:
- drag cannot be the only way to complete a task;
- provide an accessible select-then-place / equivalent single-pointer or screen-reader action.

E04 TRACE:
- tracing may remain an activity mechanic, but the learning objective must have an accessible alternative when exact gesture reproduction is not essential to the assessed skill.
- trace UI must not be the sole route to critical navigation.

Custom gestures:
- provide discoverable accessible action/equivalent.

### 5.4 Preschool usability safeguards
- large hit areas;
- clear visual hierarchy;
- no tiny close/back controls;
- no hidden gesture as sole navigation;
- no timed interaction that prevents a child from understanding the task;
- hint after approved 5–7 second window;
- no random-tap success;
- feedback begins quickly enough to preserve cause/effect;
- no flashing/strobing reward sequence that risks accessibility/safety;
- sound-off mode must not remove essential task meaning.

### 5.5 Accessibility acceptance
Core Vertical Slice cannot pass if:
- an essential control is inaccessible to VoiceOver/TalkBack;
- drag-only interaction has no equivalent where the learning objective allows an alternative;
- touch targets materially violate platform minimums;
- contrast fails required thresholds;
- modal/focus behavior traps assistive-tech users;
- important state relies on color alone.

## 6. Performance strategy

### 6.1 External facts
React Native performance documentation treats 60 FPS as the native smoothness target and advises profiling performance outside development mode.

### 6.2 Measurement rule
Performance is measured on:
- release/profile build;
- at least one lowest-supported class device;
- one representative mid-tier device;
- both iOS and Android before store release.

Exact device models are selected when minimum OS/device support is locked.

### 6.3 Provisional NamyKids budgets
These are internal PROVISIONAL targets until first Vertical Slice baseline.

Core child interaction:
- target: 60 FPS.
- no repeated visible freeze/stall during tap/drag/trace.
- touch -> visible/audio acknowledgement target p95 <= 100 ms where the action is local.

Local activity transition:
- cached/ready activity screen target p95 <= 700 ms.

Cold launch:
- target p95 <= 4.0 s to first usable account/child entry point on representative mid-tier release hardware.

Resume from background:
- target p95 <= 1.5 s to interactive state when no forced auth refresh is required.

Network-backed protected operation:
- must show explicit pending/retry state rather than appearing frozen.
- no quality PASS based solely on average latency.

### 6.4 Regression rule
After baseline is established:
- >20% regression in p95 startup or core interaction latency requires review.
- repeated dropped-frame behavior that materially affects E01/E02/E04 is release blocking even if median metrics pass.
- large memory growth across repeated activity cycles triggers leak investigation.

Thresholds may be revised only from measured release-build evidence and documented device context.

## 7. Offline, retry and resume strategy

### 7.1 Required invariants
- completion_id is stable across retries.
- activity begin snapshot is immutable.
- in-progress session stays pinned to original contentReleaseId/activityVersion/engineVersion.
- local pending completion is durable before remote retry.
- retry must not duplicate attempt/result/outbox/progress.
- entitlement uncertainty never upgrades to FULL.
- reconnect must converge to one canonical committed result.

### 7.2 Required offline scenarios
A. Start online -> complete online.
B. Start online -> go offline -> complete -> reconnect.
C. Start online -> offline -> app killed -> reopen -> reconnect.
D. Start offline from already-authorized cached state where allowed -> complete -> reconnect.
E. Duplicate network response / retry storm.
F. Server commits but client misses response.
G. Content release changes before reconnect.
H. auth token expires before retry.
I. entitlement becomes LIMITED before pending FULL write.
J. child/account revoked before queued write reaches server.

### 7.3 Expected outcomes
- B/C/F: no duplicate result; eventual reconciliation.
- G: original pinned release remains authoritative for that session.
- H: re-auth required; no unverified write.
- I: protected completion follows server-approved entitlement policy; never silently force FULL.
- J: new write rejected; cleanup/reconciliation follows deletion policy.
- failed sync is visible to internal diagnostics but never exposes technical error detail to child.

Release blocker:
- data loss, duplicate progress, cross-child mix, version switch mid-session, or fail-open entitlement.

## 8. Observability & privacy-safe telemetry

### 8.1 Principle
Observability answers:
- Is the app healthy?
- Is a quality invariant failing?
- Where did a flow fail?
It must NOT answer:
- Who is this child?
- What can we track about this child across apps/devices?

### 8.2 Allowed diagnostic fields by default
Examples:
- app version/build;
- platform/OS major version;
- route/screen code;
- engine code/version;
- content release ID / node key;
- anonymous request/completion correlation ID;
- error code/class;
- sync queue state;
- duration bucket / performance timing;
- network class only when available without restricted permission.

### 8.3 Forbidden in telemetry/logs
- child name/nickname;
- parent email/phone;
- auth token / refresh token;
- Authorization header;
- payment credentials;
- free-form support text by default;
- precise location;
- advertising identifiers;
- hardware fingerprint;
- audio/image recording;
- raw child answer content unless an approved educational/diagnostic requirement explicitly needs it and privacy review approves.

### 8.4 SDK rule
- First-party telemetry is the preferred safe baseline.
- Third-party analytics/crash SDK is NOT automatically approved.
- Each SDK requires APP-TECH-05A compatibility review before integration.
- No session replay by default.
- No automatic screen capture by observability tooling.
- SDK defaults must be audited; disabling one identifier does not prove compliance.

### 8.5 Logging rule
Production logs:
- structured;
- severity classified;
- redacted by default;
- no secrets;
- no PII by default;
- retention is configurable and must follow later approved legal/operations retention rules.

P0 observability events:
- completion commit failure;
- duplicate/idempotency conflict;
- wrong-child authorization attempt;
- binding/entitlement verification failure;
- outbox dead-letter;
- repeated crash loop;
- corrupted resume payload;
- content schema/version incompatibility.

## 9. Security-quality checks

Mandatory before release:
- no mobile service-role/secret;
- Web bearer token verified server-side;
- client parent_user_id ignored;
- wrong child -> 403 / zero writes;
- invalid token -> 401 / zero writes;
- stale entitlement -> LIMITED;
- no direct protected-table writes;
- installation ID random, not device fingerprint;
- max two active App devices enforced;
- child/account revoke blocks future writes;
- protected error responses reveal no sensitive internal schema/credentials.

## 10. Content / education quality hooks

Technical release cannot override education approval.

Published content consumed by runtime must:
- be APPROVED then PUBLISHED;
- be immutable after publication;
- use approved E01/E02/E04 engine baseline;
- include required audio/voice mapping;
- include schema-valid accessibility metadata where the engine needs it;
- be version-pinned for replay/recovery.

A technically passing activity remains blocked if Education Review is not approved.

## 11. Device / OS quality matrix

Until minimum OS support is finalized:
- test the lowest supported OS version;
- current major OS;
- one previous major OS;
- small-screen phone;
- representative mid-tier phone;
- tablet layout if tablet support remains enabled.

Android-first implementation priority does not remove iOS compatibility requirements.

Exact device list = downstream implementation input, not a blocker to this strategy.

## 12. Release blocking severity

### P0 — STOP / release blocker
- data loss or duplicate canonical progress;
- wrong-child/account access;
- secret exposed in client/log;
- fail-open FULL entitlement;
- broken Completion Commit atomicity;
- corrupted or unrecoverable resume path;
- app cannot launch/core flow unusable;
- core child flow inaccessible to screen reader with no alternative;
- content release mutates active session;
- deletion/revocation ignored.

### P1 — release blocker until fixed or explicitly waived by CMO/Product
- repeatable crash in core flow;
- severe frame/input lag in core activity;
- offline recovery fails without data corruption;
- touch targets/contrast/accessibility semantics fail core screens;
- telemetry sends prohibited data;
- device limit behavior broken;
- required parental gate missing for a gated action.

### P2 — may ship only with documented owner/fix window
- non-core layout defect;
- minor copy/accessibility hint issue not blocking operation;
- non-core performance issue;
- diagnostic gap with safe fallback.

No P0 waiver.
Any P1 waiver requires explicit human/CMO decision and written rationale.

## 13. CI / quality gate sequence

PR gate:
1. format/lint/typecheck;
2. unit tests;
3. architecture/prohibited-pattern checks;
4. content schema checks;
5. secret/permission scan.

Merge/main gate:
6. integration tests;
7. DB contract tests when DB changes;
8. build validation.

Candidate/release gate:
9. E2E Vertical Slice;
10. offline/retry matrix;
11. VoiceOver/TalkBack manual pass;
12. performance profile on representative release hardware;
13. security/advisor checks;
14. privacy/telemetry review;
15. store-policy regression review;
16. CMO/Product release decision.

## 14. Acceptance matrix

APP-TECH-05B PASS when this strategy provides:
- test pyramid and owners;
- architecture-invariant coverage;
- accessibility acceptance criteria;
- performance measurement + provisional budgets;
- offline/retry/resume failure matrix;
- privacy-safe observability contract;
- release blocker severity;
- CI/release quality sequence;
- no conflict with APP-ARCH or APP-TECH-05A;
- no fake claim that provisional thresholds are external facts.

## 15. Ownership

CMO / ChatGPT Governance:
- approves quality contract and gate status;
- resolves cross-domain conflicts.

Tech Architect / Codex implementation:
- turns contract into executable checks, CI, instrumentation and test code;
- provides measured baseline.

Gemini Education:
- approves pedagogical/content quality separately.

User / Decision Owner:
Required only for:
- a proposed P1 release waiver;
- changing supported platform/device scope;
- changing privacy/commerce/product baseline;
- accepting a material quality trade-off.

## 16. Open conditions carried forward

1. DC-APP-COMMERCE-001 remains open.
   - It does not block this quality strategy.
   - It DOES block shipping an iOS commerce/entitlement flow that violates the final commerce decision.

2. APP-TECH-05A SDK condition:
   - third-party analytics/crash SDK eligibility is still SDK-specific verification.

3. Guardian verification:
   - exact implementation method remains RESEARCH / LEGAL IMPLEMENTATION REQUIRED.

4. Minimum OS/device support:
   - exact values remain downstream implementation decisions.

## 17. Sources

Official/current references used for quality thresholds and principles:
- React Native — Performance Overview: https://reactnative.dev/docs/performance
- React Native — Accessibility/Text APIs: https://reactnative.dev/docs/text
- Apple — Accessibility HIG: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple — VoiceOver evaluation criteria: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria
- Apple — UI Design Tips (44x44pt hit target): https://developer.apple.com/design/tips/
- Android Developers — Core app quality guidelines: https://developer.android.com/docs/quality-guidelines/core-app-quality
- Android Developers — Accessibility: https://developer.android.com/guide/topics/ui/accessibility/apps
- W3C — WCAG 2.2: https://www.w3.org/TR/wcag/

## 18. Candidate decision

Recommended CMO status:
APPROVE WITH CONDITIONS

Conditions:
- provisional performance numbers must be baselined on the first release-build Vertical Slice and may be calibrated from evidence;
- exact third-party observability SDK remains unapproved until privacy review;
- exact device/minOS support remains downstream;
- commerce challenge remains separate.

No human decision is required to proceed from APP-TECH-05B into design completion / later technical specification work.
