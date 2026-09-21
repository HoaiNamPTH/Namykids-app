# Supabase App Migration Design v1.1 DRAFT

Status: DESIGN DRAFT ONLY — NOT A MIGRATION FILE
Date: 2026-09-21
Supersedes: v1.0 DRAFT
Depends on: APP-TECH-03A Shared Account & Cross-Project Data Boundary v1.0

## Target project

Supabase project: `Namykids app`
Project ref: `oohseaqfwvekrwyfelrf`

This project started from a clean baseline:
- 0 public tables
- 0 migrations
- 0 security advisor findings
- 0 performance advisor findings

## Identity boundary

Do NOT recreate Web identity as a second Auth system.

The App database stores only cross-project identity references:
- `parent_user_id` = UUID from Web Supabase Auth subject.
- `child_id` = UUID from Web `public.child_profiles.id`.

No cross-database FK is possible; integrity is enforced by trusted provisioning/reconciliation.

## Planned schemas / tables

### app.identity_binding
Server-managed parent↔child binding verified from Web authority.

### app.entitlement_snapshot
Cached LIMITED/FULL snapshot. Web remains canonical commerce/entitlement authority.

### app.device_registration
App-device registry, including active/revoked status and random installation identifier.

### content.content_release
Immutable/published release metadata.

### content.content_node_version
Release-pinned content/config version rows.

### app.activity_attempt
Immutable activity start/attempt facts.

### app.activity_result
Completion/result facts written only through Completion Commit.

### app.progress_projection
Current App progress read model.

### app.resume_pointer
Current resume state pinned to exact release/content/engine versions.

### private.domain_outbox
Transactional integration/event outbox, not exposed to mobile clients.

## API/security posture

- Mobile authenticates against Web Supabase Auth.
- Mobile does not create an App Supabase Auth user.
- Protected App runtime calls go through trusted App backend/Edge Function.
- Backend verifies the Web bearer token and derives parent identity from verified token subject.
- Direct mobile writes to protected App tables are denied.
- Grants are explicit and least-privilege.
- RLS remains enabled where exposed; internal/private schemas remain unexposed.
- Service/secret credentials remain server-side only.

## Completion Commit

One transactional boundary must:
1. accept verified parent context from the trusted backend;
2. validate active parent↔child binding;
3. validate release/activity/content version;
4. enforce idempotency by completion ID;
5. write attempt/result;
6. update progress projection;
7. update/clear resume pointer;
8. append outbox event;
9. commit all-or-nothing.

## Cross-project sync scope

From Web → App:
- parent/child binding verification
- entitlement LIMITED/FULL snapshot
- deletion/revocation events

From App → Web:
- no canonical identity/commerce writes
- Parent Hub progress consumption may be added later as a read integration; it must not create a second writable progress truth.

## Legacy Web progress cutover

Existing Web tables such as:
- `lesson_progress`
- `game_sessions`
- `activity_completions`

must receive an explicit cutover decision before App release:
- archive;
- migrate/transform;
- or retain read-only.

After cutover, they must not remain parallel writable App-progress authorities.

## Explicit pre-apply checks

1. Verify Web-token validation method against current Web Auth signing configuration.
2. Verify App schemas/table names against approved architecture.
3. Confirm explicit grants/Data API exposure.
4. Confirm private/internal schema is not exposed.
5. Confirm published-content immutability.
6. Confirm two-App-device rule.
7. Confirm cross-project deletion/revocation reconciliation.
8. Test Completion Commit rollback/idempotency.
9. Test Parent A vs Parent B isolation through API boundary.
10. Run Supabase security/performance advisors and require no new material warning.
11. Review generated TypeScript types.
12. Verify Web Supabase project is unchanged by App migration.

## Migration-file governance

This design document is intentionally not under `supabase/migrations/`.

Canonical migration filename/history must be produced by the approved Supabase migration workflow in a development/non-production execution context. Do not invent a timestamped migration filename manually.

No production database change is authorized by this document.
