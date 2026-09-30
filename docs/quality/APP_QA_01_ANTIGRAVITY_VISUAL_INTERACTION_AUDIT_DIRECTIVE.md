# APP-QA-01 — Antigravity Visual / Interaction Audit Directive

Project: NamyKids App
Baseline under audit: codex/app-build-02-pass1 @ 72f56c21fb2f68278f96ca9d4f10d74802bf44ff

Your role:
Visual + interaction reviewer only.
Do not redesign Product, Education, Architecture, DB, Auth, Commerce, or Runtime contracts.

Read:
- docs/quality/APP_QA_01_VERTICAL_SLICE_4_LAYER_AUDIT_BRIEF_v1.0.md
- docs/build/APP_BUILD_03_CODEX_KICKOFF_PASS3.md
- docs/build/APP_BUILD_03_CMO_CORRECTED_ANTIGRAVITY_HANDOFF.md
- docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md
- current Pass 3 implementation at 72f56c21fb2f68278f96ca9d4f10d74802bf44ff

Canonical visual authority:
- exact user-approved NamyKids Soft CGI / Premium Stylized 3D Cartoon direction
- legacy Figma is REJECTED / NON-CANONICAL
- final production mascot/art may only come from approved asset source
- DEV_PLACEHOLDER is valid where final asset is missing
- do not treat placeholder as final visual QA

Audit:
- S01–S12 hierarchy/state semantics
- Child World / Subject / Instruction / Missing Letters / feedback / completion / recovery / Parent Zone
- E02 drag interaction
- select_then_place alternative
- touch target practicality
- scroll/drag conflict
- focus/semantic labels
- non-color-only cues
- Parent Zone calmer visual tone
- child-safe feedback intensity
- DEV_PLACEHOLDER isolation
- any visual or interaction contradiction likely to cause rework

Output:
1. VISUAL/INTERACTION STATUS: PASS / PASS WITH CONDITIONS / REVISION REQUIRED
2. VERIFIED FACTS
3. Material contradictions only
4. Accessibility/interaction findings
5. DEV_PLACEHOLDER / asset blocker inventory
6. What must NOT be changed
7. Final handoff note for CMO

Important:
- Do not use legacy Figma as visual authority.
- Do not create new mascot art.
- Do not describe placeholder visual choices as final brand approval.
- Do not reopen runtime/API architecture.
- Do not nitpick wording/layout unless it can cause implementation rework or usability failure.
