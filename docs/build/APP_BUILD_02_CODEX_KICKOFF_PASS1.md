# APP-BUILD-02 — Codex Kickoff Brief / Build Pass 1

Status: READY FOR CODEX
Date: 2026-09-25
Repository: HoaiNamPTH/Namykids-app
Canonical orchestration source:
- docs/build/NAMYKIDS_VERTICAL_SLICE_FINAL_BUILD_PACKAGE_v1.0.md

## Mission

Implement Build Pass 1 only for the NamyKids first Vertical Slice.

Do not expand scope beyond the canonical package.

## Read first

1. docs/build/NAMYKIDS_VERTICAL_SLICE_FINAL_BUILD_PACKAGE_v1.0.md
2. docs/implementation/APP_TECH_06_VERTICAL_SLICE_TECHNICAL_SPEC_v1.0.md
3. docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md
4. docs/architecture/REPO_MAPPING_v1.0.md
5. docs/architecture/SHARED_ACCOUNT_CROSS_PROJECT_BOUNDARY_v1.0.md
6. docs/architecture/WEB_TOKEN_VERIFICATION_CONTRACT_v1.0.md
7. docs/database/APP_SCHEMA_CONTRACT_v1.0.md
8. docs/quality/APP_TECH_05B_QUALITY_STRATEGY_v1.0.md

## Build Pass 1 scope only

Create/complete the implementation foundation:

- Expo / React Native / TypeScript app bootstrap if not already present.
- Expo Router route skeleton for:
  - auth/session recovery entry
  - Child World
  - subject
  - activity
  - Parent Zone
  - restricted
  - recovery
- domain types
- pure GameSession reducer
- E02 DRAG_DROP engine interface and minimal first-slice domain contract
- content config schema for Alphabet Missing Letters — Drag & Place
- local persistence abstractions for session snapshot and pending outbox
- data-layer interfaces/adapters only, no direct screen/engine protected DB writes
- privacy-safe logging/redaction helpers
- unit tests for reducer/config/engine contracts
- static checks / lint / typecheck / secret scan as applicable

## Current education canon

First-slice mechanic:
Alphabet Missing Letters — Drag & Place

Technical engine:
E02 DRAG_DROP

Baseline:
- age 3–4
- 3 missing letters
- progression 2 → 3 → 4 → 5–6
- shuffled tray
- Lượt mới / Refresh creates a new missing-position set
- exact letters are content-driven
- no fixed letter set
- session completion != mastery
- answer-revealing support = ASSISTED

## Visual rule

Do not implement final visuals from legacy Figma.

Legacy Figma is NON-CANONICAL.

Build Pass 1 may use clearly marked DEV_PLACEHOLDER surfaces because final visual integration belongs to Build Pass 3.

Do not claim any placeholder screen is final UI.

## Architecture rules

- reducer pure
- engine does not navigate
- engine does not write DB
- screens do not write protected DB
- runtime owns completion orchestration
- Web Auth remains identity authority
- App remains learning-runtime/progress authority
- no second Auth account
- no App-owned commerce truth
- no duplicate progress store
- no fingerprint / ad ID

## Database rule

Do not change the canonical DB schema or migration in Build Pass 1 unless the existing contract is impossible to implement.

If a DB/API change appears necessary:
STOP and report the exact conflict.

## Forbidden

Do not:
- use legacy Figma as implementation source
- restore historical fixed-letter first-slice logic
- restore historical find-object first-slice logic
- invent final production mascot art
- add payment/paywall
- add analytics SDK
- add new permissions
- add direct Supabase table writes from UI/engine
- alter Completion Commit contract
- change Product/Education/UX decisions

## Required evidence before declaring Pass 1 complete

Return:
1. branch
2. HEAD commit
3. clean/dirty working tree
4. files created/changed
5. route skeleton summary
6. reducer state coverage
7. E02 interface/config summary
8. local persistence abstraction summary
9. tests run + counts
10. lint/typecheck/build result
11. secret scan result
12. architecture deviations = NONE or explicit list
13. placeholders remaining
14. blockers
15. exact next action for Build Pass 2
16. explicit statement:
   - legacy Figma not used
   - deprecated fixed-letter/find-object mechanic not used

## STOP conditions

Stop instead of guessing if:
- repo state conflicts with the Final Build Package
- canonical docs conflict
- framework bootstrap would require a product/platform decision not already approved
- a DB/API contract change is necessary
- a new permission/SDK is required
- a new Education/UX/Visual decision is required

## Completion decision

Build Pass 1 is not approved merely because code exists.

It must return the evidence above for CMO audit before Build Pass 2 begins.
