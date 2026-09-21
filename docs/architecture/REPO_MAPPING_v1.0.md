# NamyKids App — Repo Mapping v1.0

Status: LIVE REPO MAPPED / IMPLEMENTATION NOT STARTED
Date: 2026-09-21
Repository: HoaiNamPTH/Namykids-app
Architecture baseline: APP-ARCH-01 v1.2 + APP-ARCH-02 v1.0 — APPROVED/CLOSED

## Verified repository state
- Repository exists and is accessible to ChatGPT GitHub connector.
- Default branch: main.
- Repository was empty at mapping start.
- No legacy app code exists, therefore there is no code conflict to reconcile.

## Approved path contract for future implementation
- src/runtime/ — Game Runtime orchestration, state machine/reducer, Completion Commit client adapter.
- src/engines/ — reusable production engines only: E01 SELECT, E02 DRAG_DROP, E04 TRACE.
- src/content/ — content release/config parsing and schema validation; no business persistence.
- src/progress/ — read models only; no engine-owned writes.
- src/navigation/ — route guards, including Auth Guard and ParentAccessGuard.
- src/sync/ — local outbox, deduplication, retry/backoff, sync conflict handling.
- src/device/ — random installation identifier + device-registration client.
- src/data/ — repository/adapters for Supabase RPC/read models; screens/engines do not call Supabase directly.
- supabase/migrations/ — canonical migration files only after creation through Supabase CLI and Migration Gate workflow.
- supabase/tests/ — pgTAP/RLS/transaction tests.

## Current repository bootstrap
Only governance/documentation and ignore rules are being committed now. No app framework or production database change is created in this mapping step.

## Forbidden
- No direct Supabase writes from screen or engine.
- No duplicate progress store.
- No payment/paywall implementation before its approved commerce gate.
- No device fingerprint, Advertising ID/IDFA, or child PII used as technical device identifiers.
- No change to APP-ARCH-01/02 without DECISION CHALLENGE.

## Repo Mapping acceptance
1. Real repo accessible — PASS.
2. Existing tree inspected — PASS (empty repository).
3. Approved modules mapped to future paths — PASS.
4. Architecture conflict — NONE FOUND.
5. Production code/migration applied — NO.

Decision: REPO MAPPING PASS.
