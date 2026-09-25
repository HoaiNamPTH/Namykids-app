# APP Runtime API Contract v1.3 — Published Content Pin Read

Status: APPROVED TECHNICAL CONTRACT / IMPLEMENTATION PENDING
Date: 2026-09-25
Project: NamyKids App
Scope: Build Pass 3 content-runtime boundary
Supersedes for runtime composition: APP_RUNTIME_API_CONTRACT_v1.2.md
Preserves v1.2 child bootstrap/binding rules.

## 1. Verified state

VERIFIED FACT:
The current App Supabase project contains no rows in:
- content.content_release
- content.content_node_version

Therefore no valid production release_id/node_version_id currently exists for a new first-slice session.

DERIVED-INFERENCE:
Completion Commit cannot safely be composed from firstSliceDevConfig alone because the canonical RPC requires a valid published release + node version pin.

## 2. Decision

Build Pass 3 may add a trusted published-content read boundary.

The mobile client never invents release_id or node_version_id.

Canonical flow:
1. runtime-bootstrap resolves verified child_id.
2. App requests the canonical first-slice content pin.
3. trusted App backend resolves one published release + one published node version.
4. returned release_id/node_version_id/engine/version/config become the immutable session start pin.
5. session snapshot/outbox/completion reuse exactly those IDs.
6. if no eligible published content exists, runtime returns content_not_published and does not start a canonical completable session.

## 3. Stable technical node key

Technical stable node key for the approved first vertical slice:

alphabet-missing-letters

Classification:
DERIVED TECHNICAL IDENTIFIER.

It maps to the already-approved canonical activity:
Alphabet Missing Letters — Drag & Place / E02 DRAG_DROP.

This key does NOT change educational content, exact missing letters, progression or UX.
It only provides the stable identity required by the versioned content architecture.

## 4. New endpoint — runtime-content-pin

Method:
POST

Authorization:
Bearer <verified Web token>

Request:
{
  "node_key": "alphabet-missing-letters"
}

For Build Pass 3, any other node_key must be rejected as unsupported_node.

Server flow:
1. verify Web bearer token;
2. resolve/validate active child binding if child_id is included in runtime composition;
3. call service-role-only public.get_app_published_content_pin(node_key);
4. return only the immutable runtime fields required to start the session.

Success:
{
  "ok": true,
  "release_id": "<uuid>",
  "node_version_id": "<uuid>",
  "node_key": "alphabet-missing-letters",
  "engine_code": "E02",
  "engine_version": "string",
  "payload": {},
  "content_hash": "string"
}

No eligible published content:
HTTP 409
{
  "ok": false,
  "code": "content_not_published"
}

Multiple ambiguous eligible rows:
HTTP 409
{
  "ok": false,
  "code": "content_pin_conflict"
}

## 5. New RPC — public.get_app_published_content_pin

Signature:
public.get_app_published_content_pin(
  p_node_key text
) returns jsonb

Security:
- SECURITY INVOKER
- service_role EXECUTE only
- revoke PUBLIC, anon, authenticated
- fully qualify content tables
- no SECURITY DEFINER

Behavior:
1. reject empty node key;
2. select a node from content.content_node_version joined to content.content_release;
3. require release.status = 'published';
4. require node.node_key = p_node_key;
5. for this first slice require engine_code = 'E02';
6. require exactly one eligible current published pin;
7. return immutable pin fields only.

Current-release selection rule:
Use the highest published release.version for the requested node_key.

If two rows remain ambiguous at the same effective highest release version due to invalid data, raise APP_CONTENT_PIN_CONFLICT.

If none:
raise APP_CONTENT_NOT_PUBLISHED.

The RPC is read-only and performs no content mutation.

## 6. Session-start contract

A new canonical session may start only after content pin resolution.

Session snapshot must include:
- childId
- nodeKey
- releaseId
- nodeVersionId
- engineCode
- engineVersion
- contentHash where practical
- immutable beginSnapshot/config required to reconstruct offline completion
- attemptId/completionId as applicable

Refresh/Lượt mới may change round missing positions inside the pinned activity config but must NOT switch release/node version.

## 7. firstSliceDevConfig rule

firstSliceDevConfig remains:
DEV_PLACEHOLDER / development-only.

It may support layout/interaction development.

It must NOT be used as a production/canonical source for:
- release_id
- node_version_id
- content_hash
- production published content truth

When a trusted published content pin exists, runtime session composition must prefer the pinned content payload.

## 8. Local TEST_FIXTURE exception for Build Pass 3

Because the App project currently has zero published content rows, Build Pass 3 may use a LOCAL-ONLY TEST_FIXTURE to prove end-to-end Completion Commit/outbox behavior.

The fixture must be:
- clearly named TEST_FIXTURE / dev-local-only;
- deterministic;
- inserted only by local test/seed infrastructure;
- never applied to remote App Supabase;
- never presented as APPROVED education content;
- never treated as production publication;
- limited to the canonical first-slice technical shape.

Allowed fixture fields:
- release_key: dev-local-only-first-slice
- status: published ONLY because Completion Commit contract requires a published release for validation
- node_key: alphabet-missing-letters
- engine_code: E02
- engine_version: current supported dev value
- payload: minimum valid Missing Letters config consistent with approved canon
- content_hash: explicit dev/test value

Governance note:
The database word "published" on this local TEST_FIXTURE is a technical test state only.
It does NOT mean client/user/CMO-approved content publication.

## 9. Where fixture may live

Preferred:
- supabase/seed.sql if the repository already uses local seeding for reset; OR
- transaction-scoped pgTAP/integration fixture setup.

Do NOT create a production content migration merely to seed test content.

If seed.sql is used:
- mark block LOCAL TEST FIXTURE;
- keep deterministic IDs;
- ensure no secrets/PII;
- do not push seed to remote execution.

## 10. New DB change-control

Build Pass 3 may create exactly ONE additional additive local migration containing ONLY:
- public.get_app_published_content_pin(text)
- revoke/grant EXECUTE for that function

This is separate from the already-approved v1.2 binding RPC migration.

No table/trigger/schema alterations.
No existing RPC signature changes.
No schema exposure.
No remote apply/deploy.

## 11. Required tests

RPC:
- service_role can execute
- anon/authenticated cannot execute
- no published node -> APP_CONTENT_NOT_PUBLISHED
- draft release ignored
- retired release ignored
- highest published release version selected
- non-E02 first-slice node rejected/not eligible
- returned release_id/node_version_id match same published release
- function is not SECURITY DEFINER

Endpoint:
- missing bearer -> 401
- invalid bearer -> 401
- supported node key -> returns canonical pin
- unsupported node key -> 400/409 stable unsupported_node
- no published pin -> 409 content_not_published
- no raw SQL error leaks

Runtime:
- new session gets pin before ACTIVE/completable flow
- outbox preserves same releaseId/nodeVersionId
- Completion Commit uses returned pin unchanged
- reopening incomplete session preserves old pin even if a newer release later exists

Regression:
- all prior pgTAP remain PASS
- no app/content schema exposure
- no direct mobile protected-table read/write
- no parent_user_id sent by mobile

## 12. Production content boundary

This contract does NOT authorize production publication of the first content node.

Production publication still requires the approved content governance:
DRAFT -> EDUCATION_REVIEW -> PRODUCT_REVIEW -> APPROVED -> PUBLISHED

Until an APPROVED production content release exists:
- production runtime must return content_not_published;
- Build Pass 3 may still prove runtime behavior with local TEST_FIXTURE;
- final release remains blocked.

## 13. CMO decision

APP Runtime API Contract v1.3:
APPROVED WITH CONDITIONS.

No Human Decision Owner input required.

Build Pass 3 may continue with:
- runtime-content-pin endpoint;
- one additive local service-role-only SECURITY INVOKER content-pin RPC migration;
- local-only TEST_FIXTURE for E2E/Completion Commit proof;
- no remote apply/deploy.

STOP if:
- table/schema/trigger changes are required;
- production content must be invented/published without Education/Product approval;
- a new SDK/permission is required;
- runtime needs a different first-slice educational config;
- Product/UX/Visual/Commerce/Legal baseline must change.
