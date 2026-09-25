# APP Runtime API Contract v1.2 — Child Bootstrap Addendum

Status: APPROVED TECHNICAL CONTRACT / IMPLEMENTATION PENDING
Date: 2026-09-25
Project: NamyKids App
Scope: Build Pass 3 runtime composition / child binding bootstrap
Supersedes for runtime integration: APP_RUNTIME_API_CONTRACT_v1.1.md
Preserves all v1.1 contracts unless explicitly changed here.

## 1. New verified evidence

Web Supabase is the canonical identity + child-profile authority.

Verified current Web schema:
- public.child_profiles.id = canonical child UUID.
- public.child_profiles.parent_user_id references public.parent_profiles.user_id.
- public.parent_profiles.user_id references public.profiles.id.
- public.profiles.id references auth.users.id.
- child_profiles has RLS enabled.
- authenticated SELECT policy child_profiles_select_own permits rows only when auth.uid() = parent_user_id.

Therefore the Web Auth bearer token is sufficient to discover/verify the signed-in parent's own child profile through Web RLS without Web service-role credentials.

## 2. Decision

Build Pass 3 may implement a trusted child-bootstrap flow.

Canonical flow:
1. Mobile restores Web Auth session.
2. Mobile calls runtime-bootstrap with Web bearer token.
3. App Edge Function verifies token using existing approved getUser(token) flow.
4. Using Web Supabase URL + publishable key + the SAME user's bearer token, server queries public.child_profiles under Web RLS.
5. Server accepts only child rows owned by the verified Web user.
6. If exactly one canonical child exists, server calls a service-role-only App RPC to create/refresh app.identity_binding.
7. Return the canonical child_id to mobile runtime composition.
8. All later runtime-progress/runtime-completion calls use that child_id but still re-verify token + binding independently.

No client-provided child ID is trusted for provisioning.

## 3. Product baseline handling

Approved Product baseline remains:
1 NamyKids account = 1 child.

Bootstrap behavior:
- zero Web child profiles -> return child_profile_required; do not create fake/default child.
- exactly one -> bind/refresh and continue.
- more than one -> return child_profile_conflict; do not select first/random child and do not auto-delete/merge.

Multiple legacy children are treated as data-remediation conflict, not as permission to change Product baseline.

## 4. New endpoint — runtime-bootstrap

Method: POST
Authorization: Bearer <Web access token>
Request body: empty JSON object or no semantic fields.

The endpoint MUST ignore/reject client-supplied:
- parent_user_id
- child_id as provisioning authority
- entitlement claims

Server:
1. verify Web token;
2. create a Web data client with Web URL + publishable key and the verified/user bearer token;
3. query only minimum child ownership fields required for bootstrap:
   - id
   - parent_user_id if needed for defense-in-depth comparison
4. rely on Web RLS and additionally confirm returned parent_user_id equals verified user.id if selected;
5. require exactly one child;
6. invoke public.upsert_app_identity_binding(verified_parent_user_id, verified_child_id);
7. return child_id only plus safe binding status.

Success:
{
  "ok": true,
  "child_id": "<uuid>",
  "binding_status": "active"
}

Zero child:
HTTP 409
{ "ok": false, "code": "child_profile_required" }

Multiple child rows:
HTTP 409
{ "ok": false, "code": "child_profile_conflict" }

Web child source unavailable:
HTTP 503
{ "ok": false, "code": "child_source_unavailable" }

Never return nickname, email, phone or unnecessary child PII from this endpoint.

## 5. New App RPC — public.upsert_app_identity_binding

Signature:
public.upsert_app_identity_binding(
  p_parent_user_id uuid,
  p_child_id uuid
) returns jsonb

Security:
- SECURITY INVOKER
- fully qualified app.identity_binding
- EXECUTE revoked from PUBLIC, anon, authenticated
- EXECUTE granted only to service_role

Behavior:
1. serialize per parent using advisory transaction lock;
2. check whether parent already has another active child binding;
3. if another active child exists -> raise APP_PARENT_BINDING_CONFLICT;
4. check whether requested child is actively bound to another parent;
5. if yes -> raise APP_CHILD_BINDING_CONFLICT;
6. insert new binding or refresh existing exact parent+child binding:
   - source = 'web'
   - source_verified_at = now()
   - status = 'active'
   - updated_at = now()
7. preserve source_revision unless an approved revision value is supplied in a later contract;
8. return child_id + status.

Important:
This RPC does NOT verify Web ownership itself. It is service-role-only and may be called only after runtime-bootstrap has verified ownership against Web RLS.

## 6. Additive migration change-control

Exception to original Pass 3 no-DB rule:
Codex may create exactly ONE additive local migration containing ONLY:
- public.upsert_app_identity_binding(uuid, uuid)
- revoke/grant EXECUTE for that function

No table/trigger alteration.
No schema exposure.
No SECURITY DEFINER.
No existing RPC signature changes.
No remote apply/deploy.

Migration must be generated with Supabase CLI migration command, not invented filename.

## 7. Web client constraint

The bootstrap ownership query must use:
- Web Supabase URL
- Web publishable key
- the parent's current Web bearer token

Do not use or introduce:
- Web service-role/secret
- user_metadata authorization
- email/phone/nickname ownership logic
- raw client-supplied parent_user_id

The query should request only the minimum columns necessary to determine canonical child ID and ownership.

## 8. Runtime composition

After runtime-bootstrap succeeds, the app may hold the returned child_id in runtime/session state and use it for:
- runtime-entitlement
- runtime-progress
- session snapshot keying
- pending completion/outbox
- runtime-completion

Authorization still never relies on the locally held child_id alone.
Every protected server request re-verifies Web identity and active binding.

## 9. Required tests

Web bootstrap unit/integration:
- no bearer -> 401
- invalid bearer -> 401
- zero own child -> 409 child_profile_required
- exactly one own child -> binding RPC called with verified parent + returned child
- multiple own children -> 409 child_profile_conflict
- client-supplied fake child/parent cannot control provisioning
- query does not request nickname/email/phone
- Web source failure -> 503

RPC pgTAP:
- service_role can execute
- anon/authenticated cannot execute
- first binding inserts active
- same parent+child retry is idempotent/refreshes verification
- different active child for same parent -> APP_PARENT_BINDING_CONFLICT
- same child for another parent -> APP_CHILD_BINDING_CONFLICT
- function is not SECURITY DEFINER
- existing DB regression suite remains PASS

Runtime:
- bootstrap child_id feeds progress/completion composition
- locally altered child_id still fails server binding check
- no parent_user_id sent by mobile

## 10. Remote rule

Do NOT:
- apply migration remotely
- deploy Edge Function remotely
- mutate Web schema/policies
- change Web child profile rows

Pass 3 remains local/code evidence only until later approved integration/release gate.

## 11. Remaining non-blocking boundaries

This contract does NOT resolve:
- live Web entitlement refresh
- commerce/DC-APP-COMMERCE-001
- final production visual/audio asset availability
- legacy data remediation if >1 Web child exists for one parent

## 12. CMO decision

APP Runtime API Contract v1.2:
APPROVED WITH CONDITIONS.

Reason:
The canonical Web child ownership source and existing RLS policy provide direct evidence sufficient to bootstrap App identity_binding safely. No new Human Product decision is required.

Build Pass 3 may continue using runtime-bootstrap + one additive local service-role-only SECURITY INVOKER binding RPC.

STOP only if implementation evidence shows:
- Web RLS cannot enforce the ownership query with the user's bearer token;
- binding requires a Web service secret;
- schema/table/trigger changes beyond the one RPC are required;
- multiple-child data must be resolved operationally;
- Product/UX/Commerce/Legal baseline must change.
