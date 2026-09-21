# NamyKids App — Migration Test Plan v1.0

Status: READY FOR NON-PRODUCTION DRY-RUN
Date: 2026-09-21

## Schema
- New schemas/tables/functions exist as designed.
- private is not exposed through the Data API.
- FK/unique constraints exist.
- Release pinning is enforced.
- No destructive change occurs to shared Web tables.

## RLS isolation
Using Parent A/Child A and Parent B/Child B:
- A reads only A-owned app rows.
- B cannot read A-owned rows.
- anon cannot read private account/child runtime rows.
- direct writes to attempt/result/progress/resume fail.
- published content read succeeds; draft content read fails.

## Completion transaction
- Online completion writes attempt + result + progress + resume + outbox atomically.
- Offline-started completion can create required attempt state from immutable begin snapshot in one transaction.
- Duplicate completion_id returns the same committed outcome without duplicate result/outbox.
- Forced failure rolls back all writes.
- Wrong-child ownership fails with zero writes.

## Resume/version pinning
- Resume keeps original release/node/activity/engine versions.
- New publication does not mutate an in-progress pinned session.
- Historical completed attempt remains readable.

## Device registry
- First and second active devices succeed.
- Third active device is rejected by server rule.
- Revocation allows replacement.
- Web session is not counted as an App device.
- Random installation ID only; no fingerprint/IDFA/Advertising ID/child PII.

## Regression
- Existing Web auth continues working.
- Existing Parent Hub/CMS data remains unchanged.
- Existing published content paths remain unchanged until explicit cutover.
- No payment/paywall behavior is added.

## Tooling gate
- Canonical migration file must be created via Supabase CLI migration workflow, not hand-named.
- Dry-run occurs on local/preview/non-production database.
- Database/RLS/idempotency tests pass.
- Supabase security advisor has no new finding caused by the migration.
- Performance advisor is reviewed for FK/RLS filter indexes.
- Generated TypeScript type diff is reviewed.

PASS only when all above conditions pass and legacy progress cutover leaves one canonical progress truth.
