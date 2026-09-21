# APP-TECH-03A — Shared Account & Cross-Project Data Boundary v1.0

Status: APPROVED TECHNICAL DIRECTION / IMPLEMENTATION PENDING
Date: 2026-09-21

## 1. Decision

NamyKids uses two separate Supabase projects with explicit authority boundaries:

- **Web Supabase — `Namykids` / `pglafhxddkepiodyhnzd`**
  - Identity/Auth authority.
  - Parent/profile authority.
  - Child profile authority.
  - Commerce, subscription and entitlement authority.
  - Existing Web/CMS/Parent Hub data remains here.

- **App Supabase — `Namykids app` / `oohseaqfwvekrwyfelrf`**
  - App learning runtime authority.
  - Release-pinned App content/config runtime.
  - Device registration.
  - Activity attempt/result.
  - Progress projection/resume.
  - App sync/outbox state.
  - It MUST NOT create an independent customer identity or commerce truth.

The user sees **one NamyKids account**, not one Web account plus one App account.

## 2. Evidence classification

### VERIFIED FACT
- Web project currently contains `profiles`, `parent_profiles`, `child_profiles`, `subscriptions`, `payment_transactions`, `lesson_progress`, `game_sessions`, and `activity_completions`.
- `profiles.id` is tied to Web Supabase Auth `auth.users.id`.
- `child_profiles` is tied to a parent user.
- `subscriptions` and `payment_transactions` are keyed by Web user ID.
- New App project is ACTIVE_HEALTHY and started with zero public tables and zero migrations.
- Supabase projects do not automatically share `auth.users` or database foreign keys.

### DERIVED / INFERENCE
Because identity and commerce already have canonical state in Web while App requires a separate runtime database, duplicating Auth/child/subscription state as independent writable truths would create account divergence and conflicting entitlement/progress ownership.

### ASSUMPTION TO VALIDATE DURING IMPLEMENTATION
Web Auth will use a signing mode that permits reliable server-side verification of its access tokens by the App backend. If asymmetric JWKS is unavailable, the App backend must validate the bearer token against the Web Auth server rather than trust an unverified JWT locally.

## 3. Authority matrix

| Domain | Canonical authority | App copy allowed? | App write authority |
|---|---|---:|---|
| Login credentials / session identity | Web Supabase Auth | No second Auth user | No |
| Parent account/profile | Web | Read-through / minimal binding only | No canonical profile write |
| Child profile | Web | ID + minimum runtime snapshot/binding | No canonical child write |
| Subscription/payment | Web | Entitlement snapshot only | No payment/subscription write |
| LIMITED/FULL entitlement | Web | Yes, cached snapshot with source/version/time | App may refresh cache only |
| App device registry | App | N/A | Yes |
| App content release/version | App | N/A | Admin/content pipeline only |
| Activity attempts/results | App | N/A | Completion Commit only |
| App progress projection | App | N/A | Completion Commit/projection only |
| Resume pointer | App | N/A | Runtime service only |
| Legacy Web lesson/game progress | Web legacy | No new writes after cutover | Must be frozen or adapted by explicit migration/cutover |

## 4. Identity key contract

The App project does not create a local customer identity namespace.

Use the existing Web identifiers as immutable external identity keys:
- `parent_user_id` = Web `auth.users.id` UUID.
- `child_id` = Web `public.child_profiles.id` UUID.

These are **cross-project IDs, not database foreign keys**. Referential validity is enforced by trusted integration flows and reconciliation, because Postgres FK constraints cannot point across independent Supabase projects.

## 5. Authentication flow

1. Mobile App signs in against **Web Supabase Auth** using the approved NamyKids account flow.
2. Mobile holds the Web user session/access token.
3. Mobile does **not** sign in again to App Supabase Auth.
4. Calls that mutate/read protected App runtime go through an **App backend boundary** (Edge Function/API), sending the Web bearer token.
5. The App backend verifies the Web token against the Web Auth trust source:
   - preferred: Web JWKS/asymmetric signing when available;
   - fallback: validate with Web Auth server endpoint.
6. Verified token `sub` becomes `parent_user_id`.
7. The backend resolves/validates the Web child ownership before creating or refreshing the App identity binding.
8. App DB mutation then runs server-side under least privilege; secret/service credentials are never shipped to the mobile client.

## 6. Cross-project binding model

App project should contain a minimal server-managed binding, for example:

### `app.identity_binding`
- `parent_user_id uuid`
- `child_id uuid`
- `source = 'web'`
- `source_verified_at timestamptz`
- `source_revision text/null`
- `status active|revoked`

Purpose:
- prove which Web parent owns which child for App runtime;
- avoid copying parent/child PII;
- permit fast ownership checks for Completion Commit.

The binding is NOT an editable child profile.

## 7. Entitlement model

Web remains the only commerce/entitlement authority.

App stores a cache/snapshot only, e.g.:
- `parent_user_id`
- `entitlement LIMITED|FULL`
- `source_event_id/source_revision`
- `effective_at`
- `expires_at`
- `refreshed_at`

Rules:
- payment/subscription tables are not duplicated into App.
- App cannot upgrade itself to FULL.
- entitlement refresh occurs at sign-in/app resume and before protected FULL access when snapshot is stale.
- a server-to-server Web event may update the snapshot faster, but reconciliation with Web remains authoritative.
- trial state, if used, must originate from approved commerce/entitlement logic, not game code.

## 8. Progress boundary

After App runtime cutover:
- App project is the canonical truth for App activity attempts/results/progress/resume.
- Web legacy `lesson_progress`, `game_sessions`, `activity_completions` must not remain a second writable App-runtime truth.
- Parent Hub may consume App progress via a controlled read/integration layer later.
- A migration/cutover plan must explicitly state whether legacy Web progress is archived, transformed, or retained read-only.

## 9. Delete / revoke propagation

### Child deletion
Web deletes/revokes the canonical child profile → integration event/request marks App binding revoked and deletes/anonymizes App child runtime data according to approved retention policy.

### Account deletion
Web Auth/account deletion is the initiating authority → App project must purge/revoke all bindings, device registrations and runtime rows for that `parent_user_id`.

Deletion is incomplete until both project outcomes are recorded.

## 10. Security rules

- Never put Web service-role/secret or App secret key in the mobile client.
- Do not trust `user_metadata` for authorization.
- App protected tables should not be directly writable from the mobile Data API.
- Completion Commit remains the single write boundary for attempt/result/progress/resume.
- Every App backend request must derive identity from a verified token, never a client-supplied `parent_user_id`.
- Child ownership is checked server-side against the verified binding.
- Device limit is App-owned but tied to verified `parent_user_id`.
- Cross-project IDs must never be accepted solely because they are valid UUIDs.

## 11. Failure behavior

- Web Auth unavailable: existing valid session may continue only within token validity; privileged refresh/provisioning waits.
- Entitlement source unavailable and cached entitlement expired: fail closed to LIMITED, not FULL.
- Child ownership cannot be verified: do not create binding and do not write progress.
- Cross-project delete event fails: retry from outbox/reconciliation until acknowledged.
- Duplicate sync/completion event: idempotency key prevents duplicate state.

## 12. What NOT to do

- Do not copy Web `auth.users` into App Auth as an independent user store.
- Do not ask the parent to create a second App password/account.
- Do not duplicate `subscriptions` or `payment_transactions` as writable App tables.
- Do not let mobile client use service credentials.
- Do not let Web legacy progress and App progress both remain writable after cutover.
- Do not use email/phone/child nickname as cross-project identity keys.

## 13. Implementation sequence

1. Verify Web Auth token-validation method and signing mode.
2. Create App project schemas/tables for binding, entitlement snapshot, device, content release, runtime/progress, outbox.
3. Implement App backend token verification + binding provisioning.
4. Implement entitlement refresh/read-through from Web authority.
5. Implement Completion Commit using verified parent/child binding.
6. Add deletion/revocation propagation + reconciliation.
7. Dry-run migration and execute RLS/security/idempotency tests.
8. Freeze/redirect legacy Web App-progress writes.
9. Migration Gate.

## 14. Kill / review trigger

Raise DECISION CHALLENGE if:
- Web Auth token cannot be securely verified by the App backend without sharing a long-lived secret;
- Store policy requires a commerce flow that invalidates Web-only entitlement authority;
- latency/availability testing proves cross-project validation materially harms core child learning flow;
- Parent Hub requires real-time App progress in a way that creates a second writable progress store.

## 15. Decision status

APP-TECH-03A: PASS — boundary defined.
APP-TECH-03 overall: IN PROGRESS — implementation/migration and cutover tests still pending.
APP-ARCH-01 v1.2 / APP-ARCH-02 v1.0: remain APPROVED/CLOSED.
