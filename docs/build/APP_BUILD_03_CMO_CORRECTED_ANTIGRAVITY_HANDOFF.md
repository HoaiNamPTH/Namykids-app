# APP-BUILD-03 — CMO Corrected UX/Visual Handoff from Antigravity Audit

Status: CMO REVIEWED / USE WITH BUILD PASS 3
Date: 2026-09-25

Source reviewed:
Antigravity APP-BUILD-03 UX/VISUAL AUDIT & HANDOFF REVIEW

## 1. Audit decision

Use Antigravity audit as CONDITIONAL supporting evidence, not as a new canonical baseline.

Accepted findings:
1. ActivityPlayer is not yet wired to canonical GameSession reducer + runtime completion/outbox orchestration.
2. S01 Child World and S02 Subject Journey are still static placeholders and must be composed from runtime read models.
3. S04 drag/drop must avoid ScrollView/window-coordinate drift; prefer no scrolling during active interaction or container-relative measurement.
4. Accessibility implementation direction is acceptable.
5. Current visual state remains BLOCKED_BY_ASSET / DEV_PLACEHOLDER.
6. Legacy Figma remains forbidden.

## 2. Corrections to the Antigravity audit

### Runtime contract version
Antigravity reviewed v1.1.
Current canonical runtime contract is:
docs/architecture/APP_RUNTIME_API_CONTRACT_v1.2.md

v1.2 supersedes v1.1 for child bootstrap/runtime composition.

### Migration rule
Do NOT follow the audit's blanket statement "no migration".

Under Runtime API v1.2, Build Pass 3 is authorized to create exactly ONE additive local migration for:
public.upsert_app_identity_binding(uuid, uuid)

Only that RPC + revoke/grant execute statements are permitted.
No table/trigger/schema exposure/existing RPC signature change.
No remote apply/deploy.

### Mascot visual description
Do NOT use Antigravity's free-text mascot clothing description as visual authority.

Use current canonical NamyKids Character/Visual source of truth:
- approved user visual direction / approved production asset references only
- Nami/Niko identity and clothing must follow current canonical character lock
- if exact approved production raster assets are unavailable, keep DEV_PLACEHOLDER

Antigravity's wording does not override canonical character decisions.

## 3. Required Codex work from accepted audit findings

### A. Runtime orchestration
Wire ActivityPlayer to:
- GameSession reducer
- session snapshot/resume
- RuntimeDataGateway
- durable outbox
- runtime-completion
- safe S07 completion state

Do not allow local ActivityStage to become an independent canonical state machine.

A view-level stage may exist only as a derived presentation state from canonical runtime state.

### B. S01/S02/S10 data composition
Use runtime-bootstrap v1.2 first to obtain the verified/bound canonical child_id.

Then compose:
- S01 entitlement-safe availability
- S02 progress/resume read model
- S10 Parent Zone read-only progress

No fake progress or hard-coded completion state.

### C. S04 drag/drop coordinates
Do not rely on stale window measurements under a scrolling parent.

Approved options:
- disable scrolling while S04 interaction is active; OR
- use container-relative/layout-updated coordinates.

Keep select_then_place as the accessible alternative.

### D. Visual status
All screens with missing approved production raster/audio assets:
DEV_PLACEHOLDER / BLOCKED_BY_ASSET

No replacement mascot generation.
No legacy Figma.
No final visual QA claim.

## 4. Continue Build Pass 3 under v1.2

Codex should:
1. sync/cherry-pick APP_RUNTIME_API_CONTRACT_v1.2 canonical commit;
2. implement runtime-bootstrap;
3. create the one approved additive local binding RPC migration;
4. compose child_id into progress/entitlement/session/outbox/completion;
5. wire canonical reducer to ActivityPlayer;
6. fix active-interaction scroll/coordinate risk;
7. keep asset placeholders;
8. rerun all tests and local DB gates;
9. commit and push only after a coherent Pass 3 checkpoint.

## 5. STOP conditions unchanged

STOP if:
- Web child ownership cannot be verified under RLS using user bearer token;
- Web service-role becomes necessary;
- broader DB schema/table/trigger change is needed;
- new SDK/permission is needed;
- Product/Education/UX/Visual/Commerce/Legal baseline must change;
- multiple-child operational remediation is required.

## 6. CMO conclusion

Antigravity audit status:
ACCEPTED WITH CORRECTIONS.

No user decision required.
Proceed with Codex implementation using canonical v1.2 and this correction memo.
