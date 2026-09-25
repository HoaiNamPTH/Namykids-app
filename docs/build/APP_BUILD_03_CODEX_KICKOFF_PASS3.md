# APP-BUILD-03 — Codex Kickoff / Build Pass 3

Status: READY FOR CODEX
Date: 2026-09-25
Repository: HoaiNamPTH/Namykids-app
Branch baseline: codex/app-build-02-pass1 @ 5516d65e916651d9a3e85767bd889ad5814063d5

Canonical sources:
1. docs/build/NAMYKIDS_VERTICAL_SLICE_FINAL_BUILD_PACKAGE_v1.0.md
2. docs/implementation/APP_TECH_06_VERTICAL_SLICE_TECHNICAL_SPEC_v1.0.md
3. docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md
4. docs/architecture/APP_RUNTIME_API_CONTRACT_v1.1.md
5. docs/quality/APP_TECH_05B_QUALITY_STRATEGY_v1.0.md

## Mission

Implement Build Pass 3 only:
- Vertical Slice child UI
- Alphabet Missing Letters — Drag & Place interaction
- audio integration
- Parent Zone read
- offline/recovery states
- accessibility
- visual integration from approved Soft CGI source where canonical assets exist
- E2E coverage
- first performance baseline

Do not expand scope beyond this slice.

## Current locked canon

First-slice mechanic:
Alphabet Missing Letters — Drag & Place

Engine:
E02 DRAG_DROP

Education baseline:
- age 3–4
- baseline 3 missing letters
- progression 2 → 3 → 4 → 5–6
- shuffled tray
- Lượt mới / Refresh creates a new missing-position set
- exact missing letters are content-driven
- wrong placement returns/retries gently
- answer-revealing hint => assisted=true
- random/lucky placement != independent evidence
- session completion != mastery

## Visual authority

Use ONLY the user-approved NamyKids Soft CGI visual direction:
- Premium Stylized 3D Cartoon / Soft CGI
- Nami brown bear
- Niko purple rhino
- nature/storybook scenes
- rounded child-friendly UI
- image-led + voice-first
- calmer Parent Zone

Legacy Figma:
NON-CANONICAL / FORBIDDEN as final visual authority.

If an exact approved production raster asset is unavailable:
- use DEV_PLACEHOLDER
- mark it explicitly
- do NOT generate or substitute a new mascot/style
- do NOT claim final visual QA PASS

## Screen/state scope

Implement the required Vertical Slice subset of:

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

Routing must remain compatible with the approved route skeleton and trusted runtime client.

## S01 Child World

Required behavior:
- child-safe entry
- clear entry to “Chữ cái & vần”
- Parent Zone access
- entitlement-safe availability
- no commerce CTA
- no fake progress

Visual:
- approved Soft CGI/storybook direction
- DEV_PLACEHOLDER allowed only when final asset unavailable

## S02 Subject Journey

Required:
- node/progress projection from runtime read model
- resume indication when valid
- LIMITED/FULL state respected
- cached/offline state surfaced safely
- no fabricated percentages

## S03 Instruction

Required:
- short visual instruction
- mandatory voice-over support
- replay action
- no scored attempt unless current Education config requires it
- visual meaning still understandable when sound is off

## S04 Missing Letters

Required:
- ordered visible alphabet sequence
- configured missing positions
- tray of missing letters shuffled
- drag-and-place via E02
- accessible non-drag alternative: select_then_place
- no correct-only cue before response
- Refresh/Lượt mới only at valid round boundary
- Refresh creates a distinct valid missing-position set
- current round must not mutate silently

Touch behavior:
- child-size targets
- wrong placement gently returns/rejects
- correct placement gives clear positive feedback
- motor near-miss should not automatically equal knowledge error where technically distinguishable

## S05 / S06 Feedback

Correct:
- positive but non-overstimulating
- task-related reward
- no currency/economy implication

Incorrect:
- gentle retry
- no shame/punishment
- no answer reveal by default

Hint/support:
- semantic trigger, not fixed timer/count
- if answer revealed, assisted=true

## S07 Completion

Required:
- completion acknowledged only after runtime state reaches safe completion/queued state
- decorative reward only
- session completion != mastery
- if remote unavailable but completion durably queued, show child-safe “saved/syncing” state rather than technical error

## S08/S09 Recovery + Offline

Integrate:
- Web Auth session status
- runtime availability
- local session snapshot
- durable pending completion outbox
- resume
- safe retry

Required cases:
- offline mid-session
- app reopen with incomplete local session
- pending completion after missed server response
- auth expired before retry
- revoked child/binding
- stale entitlement
- transient 5xx/network

Never:
- silently drop queued completion
- mint new completion_id for same completion retry
- switch content release mid-session

## S10 Parent Zone

Read-only in this pass.

Required:
- progress projection
- current/resume state
- text summary for any visual progress indicator
- calmer visual tone
- no canonical progress mutation
- no commerce

## S11 Restricted

Required:
- LIMITED/unavailable state
- child-safe explanation
- no child commerce CTA
- no paywall/store behavior

## S12 Safe Recovery

Required:
- safe exit path
- opaque diagnostic correlation code if needed
- no SQL/backend error detail
- no token/PII

## Audio

Implement a minimal audio service abstraction for:
- instruction
- replay
- correct
- retry
- hint/support
- completion

Rules:
- voice-over mandatory for child instruction
- stop/replace audio on route/session transition where appropriate
- sound-off cannot remove essential meaning
- no microphone permission

If adding an audio package is required and not already approved:
STOP and report the exact package/need before installing.

## Accessibility

Required:
- iOS practical target >= 44x44 pt
- Android practical target >= 48x48 dp
- larger child targets preferred
- semantic labels/roles/states
- logical focus order
- no color-only critical meaning
- decorative art excluded from accessibility tree
- select_then_place path available for E02
- Parent Zone visual summaries have text alternative

Do not claim equivalence if drag-specific spatial behavior cannot be faithfully represented.

## Runtime integration

Use existing:
- secure Web Auth session adapter
- AppRuntimeClient
- runtime-entitlement
- runtime-device
- runtime-progress
- runtime-completion
- outbox reconciliation
- local session persistence

Do not:
- query app.* directly
- call protected DB tables from screen/engine
- send parent_user_id
- deploy/apply remote migration
- implement binding provisioning
- implement live entitlement refresh

## SecureStore carry-forward condition

Before Pass 3 closure, add explicit tested failure handling for:
- SecureStore read failure
- SecureStore write failure
- SecureStore delete failure

Requirements:
- no fallback to plain JSON/local unsecured storage
- child/app receives safe recoverable auth state
- no token leaked into logs
- if handling requires another SDK or a new storage architecture: STOP

## Performance baseline

Capture first release-development baseline where technically feasible:
- child input -> visible acknowledgement
- cached screen/activity transition
- cold launch
- resume

Compare against provisional APP-TECH-05B budgets.
Do not present as external/product claims.

If representative native hardware evidence is unavailable:
mark measurement PROVISIONAL / NOT YET DEVICE-VALIDATED.

## E2E / integration scenarios

Required minimum:

1. valid session -> Child World
2. Child World -> Chữ cái & vần
3. start Missing Letters
4. correct drag/place
5. wrong drag -> gentle retry
6. accessible select_then_place path
7. answer-revealing hint -> assisted
8. Lượt mới changes missing set
9. completion
10. queued completion when offline/transient failure
11. reconnect -> idempotent completion reconciliation
12. reopen -> progress
13. incomplete -> resume
14. Parent Zone read
15. LIMITED path
16. wrong/revoked child
17. stale entitlement
18. safe error recovery

If an end-to-end case requires live binding provisioning or live Web entitlement refresh:
STOP at that integration boundary and report it.
Do not invent the missing source contract.

## Visual QA

Visual QA may be:
- PASS only where approved production assets exist and are integrated
- BLOCKED BY ASSET where DEV_PLACEHOLDER remains

Audit against approved Soft CGI source only.

Do not compare against legacy Figma.

## Static/security checks

Re-run:
- lint
- typecheck
- unit tests
- quality:static
- secret scan
- no direct protected-table writes
- no prohibited identifiers
- no parent_user_id sent by mobile runtime requests
- no service credential in app bundle

## Database

No new DB change is planned in Pass 3.

Do not create migrations.

Do not apply/deploy remote DB.

If a new DB/RPC change appears necessary:
STOP.

## Dependency rule

Do not install any new SDK/package silently.

If UI/audio/testing requires a package not currently approved:
STOP and return:
- exact package
- exact use
- why built-in/current dependencies cannot satisfy it
- privacy/permission impact
- alternatives considered

## Completion evidence

Before CMO audit, commit and push all Pass 3 work to a dedicated branch or the existing Codex branch without merging main.

Return:

1. branch
2. commit SHA
3. working tree clean/dirty
4. file list
5. screens implemented
6. DEV_PLACEHOLDER list
7. exact approved asset list integrated
8. E02 interaction evidence
9. accessibility evidence
10. audio status
11. offline/outbox/resume evidence
12. Parent Zone evidence
13. LIMITED/restricted evidence
14. SecureStore failure-handling tests
15. unit/integration/E2E pass counts
16. lint/typecheck/static results
17. performance baseline
18. DB status = unchanged / no remote apply
19. architecture deviations = NONE or explicit
20. blockers
21. exact remaining work before Beta/Release
22. explicit confirmation:
   - legacy Figma not used
   - no deprecated mechanic
   - no new commerce
   - no binding provisioning/live entitlement refresh invented

## STOP conditions

STOP and report instead of guessing if:
- approved visual asset is required but missing for final claim
- new SDK/permission is required
- new DB/RPC change is required
- binding provisioning is required
- live entitlement source is required
- commerce/paywall behavior is required
- Product/Education/UX/Visual canon must change
- implementation would require using rejected Figma or substituting mascot/style

## Pass 3 completion

Pass 3 is not approved merely because screens render.

CMO audit must verify:
- learning interaction correctness
- architecture boundaries
- offline/resume/idempotency behavior
- accessibility
- asset authority
- privacy/security
- test evidence
- performance evidence
- remaining placeholders/blockers

Do not start Pass 4 or merge main before CMO audit.
