# Supabase Migration Draft — v1.0

Status: DESIGN DRAFT ONLY — NOT A MIGRATION FILE
Date: 2026-09-21

The SQL design draft is intentionally NOT stored under `supabase/migrations/` yet.

Reason: the canonical migration must be created through the approved Supabase CLI migration workflow on a non-production development context, then tested before Migration Gate approval.

## Planned database scope
- Reuse existing shared identity: auth.users / public.profiles.
- Reuse existing public.child_profiles.
- Add release-pinned content model.
- Add app device registration.
- Add activity attempt/result records.
- Add progress projection and resume pointer.
- Add private domain outbox.
- Add one transactional Completion Commit boundary with idempotency.
- Add RLS based on parent/account ownership.
- Do not create a duplicate account, child-profile, or parallel uncontrolled progress truth.

## Explicit pre-apply checks
1. Inspect existing Namykids Supabase schema and migrations again at dry-run time.
2. Reconcile legacy lesson_progress/game_sessions/activity_completions writes and define cutover.
3. Confirm exposed-schema configuration; private must remain unexposed.
4. Confirm published-content immutability enforcement.
5. Confirm two-device limit implementation.
6. Run RLS, transaction, rollback, idempotency and regression tests.
7. Run Supabase security/performance advisors.

No production database change is authorized by this document.
