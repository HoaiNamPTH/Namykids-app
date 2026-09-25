# APP Runtime API Contract v1.0

Status: APPROVED TECHNICAL CONTRACT / IMPLEMENTATION PENDING
Date: 2026-09-25
Project: NamyKids App
Scope: APP-BUILD-02 trusted runtime boundary
Depends on:
- APP-TECH-03A Shared Account & Cross-Project Data Boundary v1.0
- APP-TECH-03B Web Token Verification Contract v1.0
- APP-TECH-03C App Schema Contract v1.0
- APP-TECH-06 Vertical Slice Technical Spec v1.0

## 1. Decision

Build Pass 2 may implement the App Runtime API as trusted server-side Supabase Edge Functions / equivalent trusted backend handlers.

Mobile sends the Web Supabase bearer token.
Every protected handler derives parent_user_id from verified Web Auth.
No protected handler accepts parent_user_id as an authoritative client field.

The App Runtime API is an adapter over the already-approved database/runtime contracts. It does NOT create a new Product, Education, UX, commerce or database authority.

## 2. Common security contract

All protected endpoints:

1. Require `Authorization: Bearer <web_access_token>`.
2. Verify the token against Web Supabase Auth using the approved APP-TECH-03B method.
3. Derive `parent_user_id` only from the verified Web user.
4. Never trust client-supplied `parent_user_id`; if present, ignore or reject it.
5. Use server-only App credentials only inside the trusted backend boundary.
6. Never expose App secret/service credentials to mobile.
7. Validate `child_id` against active `app.identity_binding` before child-scoped reads/writes.
8. Fail closed.
9. Return child-safe/mobile-safe error codes; do not expose SQL/backend internals.
10. Do not log bearer tokens, parent email/phone, child nickname, payment data or other prohibited PII.

Common status mapping:
- missing/invalid/expired Web token -> 401
- valid token but inactive/wrong child binding -> 403
- malformed request -> 400
- device limit reached -> 409
- stale/unknown entitlement -> HTTP 200 with effective entitlement LIMITED, not a fail-open error
- canonical completion conflict/pin error -> 409 or 422 using stable app error code
- transient trusted-backend failure -> 503
- unexpected internal error -> 500 with opaque correlation ID only

## 3. Existing endpoint — verify-web-session

Canonical implementation:
`supabase/functions/verify-web-session/index.ts`

Purpose:
- verify Web bearer token;
- optionally validate an existing active child binding;
- return verified parent identity.

Request:
- Authorization header required
- optional JSON:
  `{ "child_id": "<uuid>" }`

Success:
`{ "ok": true, "parent_user_id": "<verified-web-user-uuid>" }`

Important:
- this endpoint does NOT authorize the mobile client to use returned parent_user_id as a trusted value in later protected requests;
- every later protected endpoint re-verifies/derives identity server-side.

Binding provisioning is NOT invented by this contract.
If no active binding exists, protected child runtime remains blocked until the approved Web-child ownership/provisioning integration is implemented or a valid binding already exists.

## 4. Entitlement endpoint — runtime-entitlement

Purpose:
Read the App-side snapshot of the Web-authoritative entitlement and compute the safe effective state.

Method:
POST

Request:
`{ "child_id": "<uuid>" }`

Server flow:
1. Verify Web bearer token.
2. Validate active child binding for verified parent + child.
3. Read `app.entitlement_snapshot` by verified parent_user_id.
4. Compute effective entitlement:
   - FULL only if snapshot is FULL, effective, and not expired;
   - otherwise LIMITED.
5. Never infer FULL from client state.
6. This endpoint does not create payment/subscription truth.

Success:
```json
{
  "ok": true,
  "entitlement": "LIMITED | FULL",
  "source_revision": "string | null",
  "effective_at": "ISO timestamp | null",
  "expires_at": "ISO timestamp | null",
  "refreshed_at": "ISO timestamp | null",
  "stale": true
}
```

If snapshot missing or stale/unusable:
- return LIMITED;
- `stale: true`.

Upstream Web entitlement refresh mechanics are NOT invented here.
This endpoint is the safe App read boundary for the current Build Pass 2.

## 5. Device endpoint — runtime-device

Purpose:
Register/refresh this App installation and enforce max 2 active App devices/account.

Method:
POST

Request:
```json
{
  "installation_id": "<random uuid>",
  "platform": "ios | android"
}
```

Rules:
- parent_user_id comes only from verified Web token;
- installation_id must be random app-generated UUID;
- no device fingerprint, IDFA, AAID or hardware-derived identity;
- upsert same parent_user_id + installation_id;
- same active device updates `last_seen_at`;
- database trigger remains final max-two enforcement;
- Web sessions are not counted.

Success:
```json
{
  "ok": true,
  "installation_id": "<uuid>",
  "status": "active",
  "active_device_count": 1
}
```

Device limit:
HTTP 409
```json
{
  "ok": false,
  "code": "device_limit_reached"
}
```

No device removal/revocation UX is added by this contract.

## 6. Progress + resume endpoint — runtime-progress

Purpose:
Read child progress projection and current resume pointer for the verified child.

Method:
POST

Request:
`{ "child_id": "<uuid>" }`

Server flow:
1. Verify Web bearer token.
2. Validate active child binding.
3. Read `app.progress_projection` for child.
4. Read `app.resume_pointer` for child.
5. Return projection/read model only.

Success:
```json
{
  "ok": true,
  "progress": [
    {
      "node_key": "string",
      "release_id": "<uuid>",
      "status": "string",
      "last_result_id": "<uuid|null>",
      "updated_at": "ISO timestamp"
    }
  ],
  "resume": null
}
```

When resume exists:
```json
{
  "release_id": "<uuid>",
  "node_version_id": "<uuid>",
  "engine_code": "E01 | E02 | E04",
  "engine_version": "string",
  "resume_payload": {},
  "updated_at": "ISO timestamp"
}
```

Rules:
- no canonical progress mutation;
- do not expose another child's data;
- no fabricated mastery/progress percentage.

## 7. Completion endpoint — runtime-completion

Purpose:
Single mobile-facing trusted boundary for the canonical `public.commit_activity_completion(...)` RPC.

Method:
POST

The client request MUST NOT contain trusted parent_user_id.

Request:
```json
{
  "child_id": "<uuid>",
  "completion_id": "<uuid>",
  "release_id": "<uuid>",
  "node_version_id": "<uuid>",
  "attempt_id": "<uuid|null>",
  "started_at": "ISO timestamp",
  "source": "online | offline",
  "begin_snapshot": {},
  "outcome": "string",
  "score": null,
  "assisted": false,
  "completed_at": "ISO timestamp",
  "result_payload": {},
  "progress_status": "string",
  "resume_payload": null,
  "requires_full": false
}
```

Server flow:
1. Verify Web bearer token.
2. Derive parent_user_id from verified Web user.
3. Validate active binding for child_id.
4. If `requires_full=true`, preserve canonical fail-closed entitlement behavior.
5. Call canonical `public.commit_activity_completion(...)` with the verified parent_user_id injected server-side.
6. Return the RPC's idempotent result.
7. Never allow screen/engine/mobile Supabase client to call protected tables directly.

Success:
```json
{
  "ok": true,
  "attempt_id": "<uuid>",
  "result_id": "<uuid>",
  "completion_id": "<uuid>",
  "idempotent": false
}
```

Duplicate safe retry:
same payload + same completion_id returns the canonical result with `idempotent: true`.

Stable error codes must include:
- `child_binding_not_active`
- `full_entitlement_required`
- `release_node_engine_pin_invalid`
- `attempt_pin_invalid`
- `invalid_activity_source`

Do not expose raw SQL exception text to mobile.

## 8. Outbox reconciliation — no separate server endpoint in v1

Decision:
There is NO dedicated `runtime-outbox` mutation endpoint in v1.

The mobile outbox stores a pending canonical completion payload locally.
Reconciliation replays that payload to `runtime-completion` using the same stable `completion_id`.

Why:
- canonical Completion Commit is already idempotent;
- a second outbox-write endpoint would create an unnecessary parallel write path;
- retry/reconciliation remains client/runtime orchestration, while canonical App state remains server-mediated.

Reconciliation algorithm:
1. durable local enqueue before remote attempt;
2. send to `runtime-completion`;
3. on canonical success/idempotent success -> remove local pending item;
4. on 401 -> refresh Web session, then retry;
5. on 403/revoked child -> stop protected retry and surface safe recovery;
6. on FULL entitlement failure -> fail closed and keep/report according to runtime policy;
7. on transient 5xx/network -> backoff/retry;
8. never generate a new completion_id for retry of the same logical completion.

## 9. Child binding scope for Build Pass 2

Build Pass 2 is authorized to:
- validate existing `app.identity_binding`;
- reject wrong/revoked/missing bindings.

Build Pass 2 is NOT authorized by this contract to invent:
- a new Web child-profile API;
- an ownership-provisioning protocol;
- child profile duplication into App;
- auto-binding based only on a client-provided UUID.

If live testing requires creation/refresh of identity_binding and no approved Web-child ownership source exists, STOP with a narrow integration blocker.

## 10. Entitlement refresh scope for Build Pass 2

Build Pass 2 is authorized to:
- read `app.entitlement_snapshot`;
- return a fail-closed effective LIMITED/FULL value.

Build Pass 2 is NOT authorized to invent:
- Web subscription/payment API behavior;
- commerce truth in App;
- Web-only iOS commerce behavior;
- a new entitlement source.

If a live refresh from Web is required and no approved Web entitlement-source contract exists, STOP with a narrow integration blocker.
DC-APP-COMMERCE-001 remains separate.

## 11. Mobile client contract

The mobile RuntimeDataGateway should map to:

- `verifySession(childId?)`
- `getEntitlement(childId)`
- `registerDevice(installationId, platform)`
- `getProgress(childId)`
- `commitCompletion(payloadWithoutParentUserId)`

Mobile:
- may use Web Supabase client only for Web Auth/session;
- must not instantiate an App privileged client;
- must not send service credentials;
- must not trust a stored parent_user_id for authorization;
- must not directly call protected App tables/RPC.

## 12. Build Pass 2 tests

Required minimum contract tests:

Auth:
- missing bearer -> 401
- invalid bearer -> 401
- fake client parent_user_id has no effect
- token belongs to Parent A + Child B binding -> 403

Entitlement:
- valid FULL snapshot -> FULL
- expired/missing snapshot -> LIMITED
- client cannot promote LIMITED -> FULL

Device:
- first device -> active
- same device retry -> idempotent/upsert
- second active device -> active
- third active device -> 409
- no fingerprint/ad ID fields

Progress:
- correct child -> own projection/resume
- wrong child -> 403
- no direct write behavior

Completion:
- verified parent injected server-side
- fake parent field ignored/rejected
- idempotent completion retry
- wrong child -> zero writes
- FULL-required with insufficient entitlement -> rejected
- invalid release/node pin -> rejected
- transient network retry keeps same completion_id

Outbox:
- successful/idempotent completion removes pending local record
- 401 causes re-auth path
- transient failure retains pending record
- revoked child stops protected retry

## 13. Database / migration rule

This API contract requires NO schema migration by itself.

Use the existing canonical tables/functions.

If implementation discovers a necessary schema/RPC change:
STOP.
Do not modify migration or remote App DB inside Build Pass 2 without a separate audited change.

## 14. Implementation file naming

Recommended Edge Function folders:
- `supabase/functions/runtime-entitlement/`
- `supabase/functions/runtime-device/`
- `supabase/functions/runtime-progress/`
- `supabase/functions/runtime-completion/`

Shared server helpers may be placed under an Edge Function shared module if supported by the existing repository/runtime conventions.

Names are part of this v1 technical contract unless implementation evidence requires a non-semantic packaging change.
A packaging-only change that preserves request/response/security behavior does not reopen Product/UX/Education.

## 15. CMO technical decision

APP Runtime API Contract v1.0:
APPROVED FOR BUILD PASS 2.

This closes the current API-contract blocker.

Pass 2 may continue with:
- already-approved secure Web Auth foundation;
- mandatory refresh-set uniqueness fix + regression test;
- runtime adapters/endpoints defined here;
- local outbox + resume integration.

Pass 2 must STOP again if:
- Web child-binding provisioning is required without an approved ownership source;
- live Web entitlement refresh is required without an approved source contract;
- a schema/RPC change is required;
- another SDK/permission is required;
- a Product/Education/UX/Visual decision is required.
