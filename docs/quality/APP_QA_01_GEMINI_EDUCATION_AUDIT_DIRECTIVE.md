# APP-QA-01 — Gemini Education Audit Directive

Project: NamyKids App
Baseline under audit: codex/app-build-02-pass1 @ 72f56c21fb2f68278f96ca9d4f10d74802bf44ff

Your role:
Education reviewer only.
Do not audit code architecture, DB, commerce, or visual polish except where it changes educational behavior.

Read:
- docs/quality/APP_QA_01_VERTICAL_SLICE_4_LAYER_AUDIT_BRIEF_v1.0.md
- docs/implementation/APP_TECH_06_VERTICAL_SLICE_TECHNICAL_SPEC_v1.0.md
- docs/design/APP_DES_04_INTERACTION_SCREEN_STATE_SPEC_v1.0.md
- docs/build/NAMYKIDS_VERTICAL_SLICE_FINAL_BUILD_PACKAGE_v1.0.md
- current first-slice implementation/config for Alphabet Missing Letters — Drag & Place

Canonical Education:
- age baseline 3–4
- learning intent = familiarization + remembering alphabet order through repeated play, not prior-knowledge testing
- baseline 3 missing letters
- progression 2 → 3 → 4 → 5–6
- tray shuffled
- Refresh / Lượt mới generates a new missing-position set
- wrong placement = gentle retry
- answer-revealing support => assisted
- random/lucky placement cannot count as independent evidence
- completion != mastery
- voice-first / visual support
- no fixed hint timer/count
- no overstimulation
- game action = cognitive action

Explicitly check for regressions into:
- find-object mechanic
- fixed A/O/V or any fixed target-distractor lock
- E01 SELECT as primary mechanic
- random-tap success
- answer cue before response
- mastery claim from session completion
- excessive cognitive load for 3–4
- incorrect alphabet-order learning logic

Output only:
1. EDUCATION AUDIT STATUS: PASS / REVIEW / HIGH
2. VERIFIED EDUCATION FACTS
3. Findings table:
   - severity: REVIEW/HIGH only
   - exact behavior
   - why it matters pedagogically
   - canonical source violated
   - required correction
4. What is already correct and must NOT be changed
5. Final Education Gate note for CMO

Do not nitpick wording unless it changes learning behavior.
If there is no REVIEW/HIGH issue, return PASS clearly.
