# APP Runtime API Contract v1.1

Status: APPROVED TECHNICAL CONTRACT / IMPLEMENTATION PENDING
Date: 2026-09-25
Project: NamyKids App
Scope: APP-BUILD-02 trusted runtime boundary
Supersedes: APP_RUNTIME_API_CONTRACT_v1.0.md

Depends on:
- APP-TECH-03A Shared Account & Cross-Project Data Boundary v1.0
- APP-TECH-03B Web Token Verification Contract v1.0
- APP-TECH-03C App Schema Contract v1.0
- APP-TECH-06 Vertical Slice Technical Spec v1.0

## 1. Decision

Build Pass 2 may implement the App Runtime API as trusted server-side Supabase Edge Functions / equivalent trusted backend handlers.

The mobile client sends the Web Supabase bearer token.
Every protected handler verifies the token and derives parent_user_id from the verified Web user.
No protected handler accepts parent_user_id as an authoritative client field.

The App Runtime API remains an adapter over already-approved runtime/database truth.
It does not create a new Product, Education, UX, commerce or identity authority.

## 2. Canonical DB access model — v1.1 change

The App schemas `app`, `content`, and `private` MUST remain unexposed to the mobile Data API.

Do NOT:
- add `app` to `supabase/config.toml` exposed schemas;
- grant `anon` or `authenticated` direct access to App runtime tables;
- add a direct Postgres connection string to the mobile client;
- add a direct Postgres connection string to Edge Functions merely to bypass the Data API;
- move App runtime tables back into public.

Trusted Edge Functions call narrowly-scoped RPC functions in the already-exposed `public` schema using the App project server-only service credential.

Security model:
- RPC functions use SECURITY INVOKER/default invoker semantics;
- the Edge Function client runs as service_role;
- service_role already has schema/table privileges on app/content/private;
- every new RPC has EXECUTE revoked from PUBLIC/anon/authenticated and granted only to service_role;
- RPC functions set an explicit safe search_path or fully qualify every object;
- the Edge Function still verifies Web bearer token first and injects verified parent_user_id server-side.

This is an additive trusted API surface, not direct mobile DB exposure.

## 3. Existing protected functions preserved

Existing functions remain canonical:
- public.app_has_active_identity_binding(parent_user_id, child_id)
- public.commit_activity_completion(17 args)
- public.revoke_app_identity(parent_user_id, child_id)

Do not change their signatures in Build Pass 2.

## 4. New RPC — public.get_app_runtime_entitlement

Purpose:
Return the safe effective entitlement snapshot for a verified parent.

Signature:
`public.get_app_runtime_entitlement(p_parent_user_id uuid) returns jsonb`

Behavior:
- read app.entitlement_snapshot for p_parent_user_id;
- return FULL only when:
  - entitlement = 'FULL'
  - effective_at <= now()
  - expires_at is null or expires_at > now()
- otherwise return LIMITED;
- missing snapshot => LIMITED + stale=true;
- expired snapshot => LIMITED + stale=true;
- do not create/refresh Web commerce truth.

Suggested return shape:
```json
{
  "entitlement": "LIMITED | FULL",
  "source_revision": null,
  "effective_at": null,
  "expires_at": null,
  "refreshed_at": null,
  "stale": true
}
```

Security:
- SECURITY INVOKER;
- fully-qualified app.entitlement_snapshot;
- EXECUTE service_role only.

## 5. New RPC — public.register_app_device

Purpose:
Register or refresh one random installation ID and preserve the existing max-two-device trigger as final enforcement.

Signature:
`public.register_app_device(p_parent_user_id uuid, p_installation_id uuid, p_platform text) returns jsonb`

Behavior:
- p_platform must be ios|android;
- no fingerprint/AAID/IDFA/hardware-derived ID;
- same parent + installation upserts/refreshes last_seen_at and keeps active;
- new device insert uses app.device_registration;
- existing database trigger remains authoritative for max 2 active devices;
- on APP_DEVICE_LIMIT_REACHED the Edge Function maps to HTTP 409 stable code;
- return installation_id, status, active_device_count.

Security:
- SECURITY INVOKER;
- service_role only;
- parent_user_id is supplied only by trusted Edge Function after Web token verification.

This RPC does NOT add device-revocation UX or product behavior.

## 6. New RPC — public.get_app_runtime_progress

Purpose:
Return progress projection + resume pointer for one verified parent/child.

Signature:
`public.get_app_runtime_progress(p_parent_user_id uuid, p_child_id uuid) returns jsonb`

Behavior:
1. verify active app.identity_binding for parent + child inside the RPC;
2. if not active, raise APP_CHILD_BINDING_NOT_ACTIVE;
3. read app.progress_projection for child;
4. read app.resume_pointer for child;
5. return read-only JSON.

Return:
```json
{
  "progress": [],
  "resume": null
}
```

Progress entries may contain only:
- node_key
- release_id
- status
- last_result_id
- updated_at

Resume may contain only:
- release_id
- node_version_id
- engine_code
- engine_version
- resume_payload
- updated_at

Rules:
- no progress mutation;
- no fabricated percentage/mastery;
- no other-child data.

Security:
- SECURITY INVOKER;
- service_role only;
- child binding checked inside RPC even though Edge Function also checks.

## 7. Completion boundary

No new completion RPC is needed.

Edge Function `runtime-completion`:
1. verifies Web bearer token;
2. derives parent_user_id;
3. validates child binding;
4. invokes existing public.commit_activity_completion(...) with verified parent_user_id;
5. maps stable DB errors to safe API errors.

The canonical 17-argument Completion Commit signature remains unchanged.

## 8. Outbox reconciliation

No server outbox endpoint.

Mobile durable outbox replays `runtime-completion` using the same stable completion_id.

- canonical success/idempotent success -> remove local pending record
- 401 -> refresh Web Auth then retry
- 403/revoked child -> stop protected retry
- transient network/5xx -> retain and backoff
- never mint a new completion_id for the same logical completion

## 9. Edge Function endpoints

Build Pass 2 may implement:
- verify-web-session (existing)
- runtime-entitlement
- runtime-device
- runtime-progress
- runtime-completion

Each new function:
- Web bearer token required
- Web Auth verified server-side
- parent_user_id derived server-side
- App service credential server-only
- no raw SQL/database internals exposed in errors
- no bearer token/PII in logs

## 10. Identity binding provisioning

This contract authorizes validation of existing app.identity_binding only.

It does NOT authorize:
- auto-binding from a client-provided child UUID;
- copying Web child profiles into App;
- inventing a Web child ownership endpoint.

If live integration requires creating/refreshing binding and no approved Web ownership source exists:
STOP — narrow integration blocker.

## 11. Entitlement source refresh

This contract authorizes reading app.entitlement_snapshot and fail-closed LIMITED/FULL calculation.

It does NOT authorize:
- inventing a new Web subscription/payment endpoint;
- mutating Web commerce truth;
- resolving DC-APP-COMMERCE-001;
- inventing live Web refresh semantics.

If live test requires Web->App entitlement refresh and no approved source contract exists:
STOP — narrow integration blocker.

## 12. Additive migration contract

Codex is authorized to create ONE new additive local migration for the three RPCs above.

Process:
1. generate migration via Supabase CLI `supabase migration new <descriptive_name>`;
2. add only the three approved RPCs + revoke/grant statements;
3. do not alter existing tables, triggers, schemas or existing function signatures;
4. do not expose `app` schema;
5. do not apply remote migration during Build Pass 2;
6. run clean local reset twice;
7. run existing pgTAP 52/52 plus new RPC tests;
8. run database/security advisors;
9. return migration filename + test/advisor evidence for CMO audit.

Required privilege pattern for EACH new function:
- revoke all on function <signature> from public, anon, authenticated;
- grant execute on function <signature> to service_role;

Do not use SECURITY DEFINER for these RPCs.

## 13. Required new DB tests

Entitlement RPC:
- FULL active snapshot -> FULL
- expired FULL -> LIMITED/stale
- missing snapshot -> LIMITED/stale
- anon/authenticated cannot execute

Device RPC:
- first device active
- same installation refresh idempotent
- second device active
- third active device rejected
- invalid platform rejected
- anon/authenticated cannot execute

Progress RPC:
- active correct binding returns only own child projection/resume
- wrong/revoked binding fails
- no rows from other child
- anon/authenticated cannot execute

Regression:
- existing 52 pgTAP remain PASS
- Completion Commit unchanged
- app schema remains unexposed
- no new direct grants to anon/authenticated on app/content/private

## 14. Mobile/Edge client rule

Mobile Web Supabase client:
- Web Auth/session only
- official publishable key only
- secure session storage
- no App service credential

Edge Functions:
- may use App server-only service credential
- call public RPCs only for protected App runtime DB access
- do not call app.* tables directly through an exposed custom schema

## 15. Build Pass 2 STOP conditions

STOP if:
- any implementation requires exposing app schema;
- SECURITY DEFINER is proposed for convenience;
- existing Completion Commit signature must change;
- existing table/trigger structure must change;
- a direct DB connection/credential model is proposed;
- binding provisioning needs a new Web ownership source;
- entitlement refresh needs a new Web commerce source;
- another SDK/permission is required;
- Product/Education/UX/Visual baseline must change.

## 16. CMO decision

APP Runtime API Contract v1.1:
APPROVED WITH CONDITIONS.

Approved change:
- three service-role-only SECURITY INVOKER public RPC wrappers;
- one additive local migration;
- no remote apply in Build Pass 2.

Reason:
The current private App schemas are intentionally not exposed via Data API. The additive RPC surface preserves that security boundary while making the already-approved Edge Function runtime contract implementable.

APP_RUNTIME_API_CONTRACT_v1.0.md is SUPERSEDED and must not be used for Build Pass 2.
