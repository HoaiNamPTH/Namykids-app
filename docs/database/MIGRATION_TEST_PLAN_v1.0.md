# NamyKids App — Migration Test Plan v1.1

Status: READY FOR NON-PRODUCTION DRY-RUN
Date: 2026-09-21
Supersedes: v1.0
Depends on: APP-TECH-03A, APP-TECH-03B, APP-TECH-03C

## 1. Web token verification
- Valid Web Supabase access token is accepted by the App backend via server-confirmed Web Auth verification.
- Expired token is rejected.
- Corrupted token is rejected.
- Token issued by an unrelated Supabase project is rejected.
- Client-supplied parent_user_id is ignored; verified token subject is authoritative.
- Valid Parent A token + Child B request is rejected with zero App DB writes.
- Web Auth outage never fails open.
- No Web service-role/secret credential is present in the mobile bundle.

## 2. Schema
- Schemas/tables/functions match APP_SCHEMA_CONTRACT_v1.0.
- private is not exposed through the Data API.
- identity_binding contains only cross-project IDs/minimal verification metadata, not copied PII.
- entitlement_snapshot does not duplicate subscription/payment truth.
- FK/unique constraints exist for intra-App relationships.
- No cross-project FK is falsely declared.
- Release pinning is enforced.
- No destructive change occurs to the Web Supabase project.

## 3. API / RLS isolation
Using Parent A/Child A and Parent B/Child B:
- Mobile cannot directly INSERT/UPDATE/DELETE protected runtime tables.
- anon cannot read private runtime rows.
- protected App reads/writes go through the trusted backend boundary.
- Parent A cannot access Parent B binding/device/runtime rows.
- published content read succeeds only through the explicitly approved read surface.
- draft content is not publicly readable.
- grants and RLS are tested together for every exposed object.

## 4. Completion transaction
- Online completion writes attempt + result + progress + resume + outbox atomically.
- Offline-started completion can create/find required attempt state from immutable begin snapshot in one transaction.
- Duplicate completion_id returns the same committed outcome without duplicate result/outbox.
- Forced failure rolls back all writes.
- Wrong-child ownership fails with zero writes.
- Stale entitlement can never be treated as FULL without authoritative refresh.

## 5. Resume / version pinning
- Resume keeps original release/node/activity/engine versions.
- New publication does not mutate an in-progress pinned session.
- Historical completed attempt remains readable.
- Engine baseline rejects unapproved production engine codes outside E01/E02/E04.

## 6. Device registry
- First and second active devices succeed.
- Third active device is rejected by server rule.
- Revocation allows replacement.
- Web session is not counted as an App device.
- Random installation ID only; no fingerprint/IDFA/Advertising ID/child PII.

## 7. Cross-project deletion / revocation
- Web child deletion/revocation blocks new App writes for that child.
- Web account deletion revokes App bindings and devices.
- App cleanup/reconciliation outcome is recorded.
- Failed propagation is retried through outbox/reconciliation.
- No orphan active binding survives a confirmed source deletion.

## 8. Legacy progress cutover
- Web legacy lesson_progress/game_sessions/activity_completions are explicitly classified before release.
- After cutover, only one writable App progress authority exists.
- Parent Hub integration, if added, is read/integration only unless separately approved.

## 9. Regression
- Existing Web Auth continues working.
- Existing Parent Hub/CMS/commerce data remains unchanged.
- Existing Web Supabase project receives no App migration DDL.
- No payment/paywall behavior is added.
- App project security/performance advisor baseline remains free of new material findings caused by migration.

## 10. Tooling gate
- Canonical migration file is created via approved Supabase CLI migration workflow, not hand-named.
- Dry-run occurs on local/preview/non-production database.
- Database/API/auth/idempotency tests pass.
- Supabase security advisor has no new material finding caused by migration.
- Performance advisor is reviewed for required indexes.
- Generated TypeScript type diff is reviewed.
- Migration list/history is verified.

PASS only when all above conditions pass and legacy progress cutover leaves one canonical progress truth.
