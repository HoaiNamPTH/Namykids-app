# APP-DES-04 — Interaction & Screen-State Spec v1.0

Status: APPROVED WITH CONDITIONS
Date: 2026-09-24
Project: NamyKids App
Replaces: clickable Figma prototype requirement for this project
Reason: explicit User Decision Owner change control on 2026-09-24 — Figma scaffold was rejected as visually non-canonical and Figma is no longer a design authority.

## 1. Source-of-truth hierarchy

Implementation MUST follow this precedence:

1. Product canon
   - APP-PROD-01/02/03/04/05/06/08 — APPROVED
2. Education canon
   - APP-EDU-06 approved mechanic reconciliation and exact first-slice letter-form lock
3. UX canon
   - APP-UX-04 — approved screen flow/state semantics
4. Visual canon
   - exact user-approved NamyKids Soft CGI concept board/image approved 2026-09-24
5. This document
   - maps the four approved layers into implementation-ready screens and states
6. Legacy Figma
   - NON-CANONICAL / REJECTED / REFERENCE ONLY

If a future artifact conflicts with a higher-priority source, the higher-priority source wins.

## 2. Visual lock

The following are LOCKED and MUST NOT be redesigned without explicit User Decision Owner change request:

- official NamyKids logo color usage from the approved primary logo;
- Premium Stylized 3D Cartoon / Soft CGI art direction;
- Nami brown bear and Niko purple rhino look & feel from the approved visual;
- bright nature/storybook environments;
- rounded, toy-like UI surfaces;
- image-led + voice-first child interface;
- strong visual hierarchy with limited reading load for the child;
- cheerful reward/feedback treatment;
- visually distinct, calmer Parent Zone;
- no flat-vector placeholder art as final production artwork;
- no emoji/primitive SVG/CSS fake-3D as main illustration;
- no visual pressure to purchase inside the child flow.

The approved image is visual reference only. Text or state logic shown in it cannot override Product/UX/Education canon.

## 3. First Vertical Slice scope

Canonical Vertical Slice:
Account/session already valid → Child World → Chữ cái & vần → first approved unit → instruction/orientation → active learning interaction → feedback → progress commit → return/resume → Parent Zone.

Exact first learning-content lock — superseding the older A/O/V + M07 decision:
- Canonical concept: **Alphabet Missing Letters — Drag & Place**.
- Audience baseline: **3–4 tuổi**.
- Learning intent: làm quen và ghi nhớ trật tự chữ cái qua chơi lặp lại; **không phải bài kiểm tra thuộc bảng chữ cái**.
- Baseline challenge: **3 chữ thiếu**.
- Progression: **2 → 3 → 4 → 5–6 chữ thiếu**; **6–7 chữ không phải baseline**.
- Interaction loop: kéo chữ từ tray vào đúng vị trí trống; tray được shuffle giữa lượt.
- Refresh / “Lượt mới”: tạo một bộ vị trí chữ thiếu mới thay vì lặp đúng layout cũ.
- Canonical technical interaction family: **E02 DRAG_DROP** for the drag-and-place behavior.
- Hint/support must preserve learning intent and must not turn into answer-revealing auto-solve by default.
- Random dragging / lucky placement must not be treated as independent mastery evidence.
- Session completion is not mastery.

Superseded:
- M07 Find-Object in Scene = old decision, no longer the first-slice mechanic.
- A/O/V target-distractor set = old decision, no longer canonical.
- The approved visual concept may contain illustrative letter examples; those examples do not define the canonical missing-letter set.

## 4. Canonical screen map

### S01 — Child World / Home
Purpose:
- child chooses learning group;
- accessible entry to Parent Zone exists separately.

Visual:
- approved Soft CGI nature scene;
- Nami/Niko as guides;
- eight learning groups displayed as illustrated mini-scenes/cards;
- Chữ cái & vần is the active Vertical Slice entry;
- other groups may display available/coming/restricted state according to Product data.

Required actions:
- Tap Chữ cái & vần → S02.
- Parent/menu action → S10 Parent Zone.
- Restricted group → S11 Restricted state only if entitlement/content status requires it.

Must NOT:
- expose purchase price/link/QR to child;
- use flat icons as main group art;
- show a completion/mastery claim not supported by progress state.

### S02 — Subject Journey: Chữ cái & vần
Purpose:
- orient child to subject;
- start/resume first approved unit.

Visual:
- nature/storybook path or scene consistent with approved concept;
- Nami/Niko can guide but cannot obscure learning targets.

Required states:
- available current unit;
- completed unit;
- locked/unavailable unit;
- loading;
- offline cached;
- offline unavailable;
- resume-in-progress.

Actions:
- Start/Resume → S03.
- Back → S01.

### S03 — Instruction / Orientation
Purpose:
- explain exactly one immediate action before assessment.

Education rule:
- M12 may be used here for orientation/reinforcement only.
- Voice-over mandatory.
- text is secondary to audio/visual cue.

Visual:
- target uppercase A clearly rendered with geometry rules;
- Nami/Niko may model/encourage;
- replay-audio control present.

Actions:
- Begin/Continue → S04.
- Replay instruction.
- Back → S02.

Must NOT:
- reveal which object is correct in the upcoming assessed scene;
- add a second learning objective;
- turn instruction into a scored attempt.

### S04 — Active Alphabet Missing Letters — Drag & Place
Purpose:
- child fills missing positions in an ordered alphabet sequence by dragging the available letters into the correct gaps.

Canonical interaction:
- baseline uses 3 missing positions for the 3–4 age band;
- progression may use 2, 3, 4, then 5–6 missing positions;
- tray order is shuffled;
- “Lượt mới” refreshes the missing-letter set;
- drag/drop must preserve clear target zones and avoid accidental success from random placement;
- wrong placement returns the item or gives gentle retry feedback without removing the challenge;
- exact letters shown in a round come from approved content config, not from old A/O/V hard-coding.

Actions:
- Correct placement → continue within S04 until the current round is complete.
- Wrong placement → gentle retry state without answer leakage.
- Hint/support when eligible → remain in the same round with assisted evidence if the support reveals the answer.
- Replay voice instruction.
- Back → S02, preserving resumable state according to UX canon.

### S05 — Correct Feedback
Purpose:
- acknowledge correct response without overstimulation.

Rules:
- positive feedback tied to task;
- no random reward economy;
- progress/result commit begins before completion acknowledgement is treated as final;
- session completion does not equal mastery.

States:
- committing;
- committed;
- commit retry/offline queued;
- completion acknowledgement.

Actions:
- if more rounds/evidence are required by content config → next configured round;
- if unit/session completion criteria are met → S07;
- if sync pending → child-safe acknowledgement while internal state remains queued.

### S06 — Try Again / Incorrect Feedback
Purpose:
- support correction without answer leakage.

Rules:
- distractors do not disappear merely because chosen incorrectly;
- feedback must not shame;
- motor near-miss != knowledge error;
- answer-revealing hint/support marks evidence ASSISTED;
- no fixed hint timer/count is canon unless later UX experiment sets a tested configuration.

Actions:
- Retry → S04.
- Hint when semantically eligible → S04 with assisted state.
- Back → S02.

### S07 — Completion / Reward
Purpose:
- celebrate completion of this session/activity.

Visual:
- Soft CGI positive celebration consistent with approved visual;
- stars may be decorative feedback but are NOT virtual currency/economy.

Required state:
- local/remote completion status known or safely queued;
- no false mastery label.

Actions:
- Continue subject → S02.
- Home → S01.

### S08 — Loading / Recovering
Use when:
- content is loading;
- resume payload is being restored;
- entitlement/session verification is pending.

Rule:
- never silently fail open to FULL.
- no indefinite blank/frozen screen.

Actions:
- automatic transition on success;
- retry or safe fallback on failure.

### S09 — Offline / Sync Pending
Purpose:
- preserve learning continuity where allowed.

Child-facing behavior:
- simple non-technical message if action cannot continue;
- do not display backend error details.

Internal behavior:
- pinned contentReleaseId/activityVersion/engineVersion;
- stable completionId;
- durable outbox before remote retry;
- no duplicate progress;
- no release switch mid-session.

### S10 — Parent Zone
Purpose:
- parent-only management/progress surface.

Visual:
- calmer, denser information hierarchy than child screens;
- matches approved concept direction without copying child game layout.

Core sections:
- progress overview;
- skill/development view;
- child profile;
- entitlement/status;
- devices;
- account/data management.

Important constraints:
- Parent Zone itself is NOT automatically required to use a PIN.
- A parental gate is required only for actions/policies that demand one.
- No child-facing commercial pressure.
- Account deletion and child deletion are separate confirmed actions.

### S11 — Restricted / Unavailable
Purpose:
- neutral child-safe state when content is unavailable.

Rule:
- do not present price, external purchase link or QR inside child flow.
- entitlement uncertainty = LIMITED, never FULL.

Actions:
- Return to Child World or subject list.

### S12 — Error / Safe Recovery
Use for:
- corrupted content;
- unrecoverable resume payload;
- auth/session problem;
- content-version incompatibility.

Rules:
- child gets non-technical safe copy;
- technical details go only to privacy-safe diagnostics;
- no raw token/PII/error payload shown.

## 5. State matrix

| State | Trigger | Child-facing intent | Data/tech need | Next action |
|---|---|---|---|---|
| READY | validated session + content ready | allow start | content release + entitlement | S02/S03 |
| INSTRUCTION | unit entered | explain one action | voice asset + target metadata | S04 |
| ACTIVE | instruction completed | perform M07 | pinned activity/version | S05/S06 |
| CORRECT | target selected | positive feedback | result candidate | commit/check |
| INCORRECT | distractor selected | try again | attempt evidence | S04 |
| ASSISTED | answer-revealing support used | continue without penalty language | assisted=true | S04/S05 |
| COMMITTING | response qualifies for persistence | child-safe waiting/feedback | Completion Commit | COMMITTED/QUEUED |
| COMMITTED | atomic commit succeeded | continue/reward | result+progress+outbox | S07/S02 |
| QUEUED_OFFLINE | remote unavailable after durable local queue | continue safely where permitted | outbox/local state | retry later |
| RESUMABLE | prior incomplete session exists | resume current place | ResumePointer | S03/S04 |
| LIMITED | entitlement not FULL/unknown | neutral unavailable state | entitlement | S11 |
| REVOKED | child/account revoked | stop protected access | auth/binding | safe exit |
| ERROR_RECOVERABLE | temporary failure | retry | error class | previous valid state |
| ERROR_FATAL | corrupt/incompatible state | safe exit | diagnostics | S01/S02 |

## 6. Navigation contract

Primary child path:
S01 → S02 → S03 → S04 → S05/S06 → S07 → S02/S01.

Retry path:
S04 wrong → S06 → S04.

Resume path:
S01/S02 → RESUMABLE → S03 or S04 depending saved semantic state.

Parent path:
S01 → S10 → S01.

Restricted path:
S01/S02 → S11 → S01/S02.

Fatal recovery:
any protected learning state → S12 → safe exit.

No route may:
- bypass Auth Guard;
- bypass ParentAccessGuard where applicable;
- navigate from engine code;
- write progress directly from UI/engine.

## 7. Audio contract

Voice-over is mandatory for child instructions.

Required audio classes:
- instruction;
- replay instruction;
- correct acknowledgement;
- gentle retry;
- hint/support;
- completion acknowledgement.

Rules:
- sound-off setting cannot make essential task meaning unavailable;
- voice content is versioned with activity content;
- audio failure must have a safe visual equivalent;
- audio must not be required for Parent Zone navigation.

## 8. Accessibility mapping

Child UI:
- iOS practical minimum hit target: 44x44 pt.
- Android practical minimum: 48x48 dp.
- prefer larger child-facing targets.
- important state not conveyed by color only.
- meaningful art has semantic alternative where needed.
- decorative art excluded from accessibility tree.
- screen-reader focus cannot be trapped by decorative layers.

M07:
- interaction objective must remain operable under accessibility requirements.
- if scene-based exact visual discrimination cannot be equivalently assessed through a screen reader, provide an approved alternative route rather than pretending the same visual task is accessible.

Parent Zone:
- VoiceOver/TalkBack operable;
- logical reading/focus order;
- charts require textual summary.

## 9. Entitlement / commerce presentation

Child screens:
- never show external purchase link;
- never show price;
- never show QR checkout;
- never pressure child to ask parent to buy.

Allowed child-facing restricted message:
- neutral availability language;
- route back to available learning.

Parent Zone:
- may show entitlement status.
- exact upgrade/payment UX is NOT locked here because DC-APP-COMMERCE-001 remains open.
- do not implement iOS Web-only purchase flow until that challenge is resolved.

## 10. Data/privacy presentation

Do not render or log on child screens:
- parent email/phone;
- auth/session tokens;
- precise location;
- advertising identifiers;
- hardware fingerprint;
- payment details.

Device registry uses random installation ID only.

Account/child deletion:
- separate parent-confirmed actions;
- downstream behavior follows approved privacy/legal constraints;
- this spec does not invent unconditional hard-delete semantics beyond policy.

## 11. Visual-to-functional correction ledger

The approved visual concept contains some illustrative details that are NOT canonical behavior.

| Visual example | Canonical correction |
|---|---|
| Letter examples shown in concept art | Do not infer a fixed A/O/V or A/B/C set; canonical mechanic is Missing Letters — Drag & Place with round-specific missing letters from content config |
| Age selection onboarding shown | Do not infer new onboarding requirement from image; follow approved account/child-profile Product flow |
| Stars/+3 shown | Decorative reward only; no currency/economy |
| Progress percentage | Only render if derived from approved progress model; no fabricated percent |
| Specific counts such as 29 letters/87 activities | Do not ship from image alone; use approved content dataset |
| Bottom navigation labels | Visual reference only; route architecture remains Product/UX authority |
| Parent dashboard metrics | Only display values supported by derived projections |
| Upgrade/payment implication | Deferred to commerce decision challenge |

## 12. Asset handoff contract

Production build requires:
- official primary NamyKids logo asset;
- production Nami raster assets;
- production Niko raster assets;
- approved scene/background rasters;
- glyph geometry-master assets or deterministic render source for A/O/V;
- audio manifest;
- icon set;
- asset manifest mapping stable IDs to versions.

No implementation may substitute:
- emoji;
- flat placeholder mascot;
- random stock cartoon;
- AI-generated replacement that changes canonical mascot identity/style.

If a required production asset is not ready:
- use a clearly labeled implementation placeholder only in development;
- placeholder cannot be presented as final visual QA;
- release gate remains blocked for that screen.

## 13. APP-DES-04 audit checklist

PASS only if:
- visual source of truth is explicitly the user-approved image, not Figma;
- screen/state mapping preserves Product/UX/Education canon;
- superseded A/O/V + M07 decision is explicitly removed and Missing Letters — Drag & Place is canonical;
- retry/hint/assisted semantics preserved;
- offline/resume states mapped;
- Parent Zone and restricted states mapped;
- commerce not invented;
- accessibility hooks defined;
- asset handoff rules prevent visual substitution;
- no requirement forces a new business/product choice.

## 14. CMO audit & decision

Audit result: PASS.

Checked:
- visual authority remains the user-approved image, not Figma;
- Product / UX / Education precedence is explicit;
- older A/O/V + M07 decision is explicitly superseded by Missing Letters — Drag & Place;
- retry / hint / assisted semantics are preserved;
- offline / resume / entitlement fail-closed states are represented;
- Parent Zone and restricted states do not invent new commerce or PIN rules;
- accessibility and asset handoff requirements are testable;
- no new human Product/Business choice is required.

CMO status:
APPROVED WITH CONDITIONS

Conditions carried forward:
1. Final production raster asset pack must match the approved visual before visual QA/release.
2. DC-APP-COMMERCE-001 remains open and blocks final iOS commerce UX.
3. Exact guardian verification method remains downstream legal implementation.
4. Exact minOS/device support remains downstream technical decision.

No new User Decision Owner input is required to proceed to APP-TECH-06.
