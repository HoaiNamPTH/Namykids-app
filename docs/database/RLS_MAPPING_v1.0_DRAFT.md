# NamyKids App — RLS & API Access Mapping v1.1 DRAFT

Status: DRAFT / NOT APPLIED
Date: 2026-09-21
Supersedes: v1.0 DRAFT
Depends on: APP-TECH-03A Shared Account & Cross-Project Data Boundary v1.0

## Security model change

The mobile App authenticates against the Web Supabase Auth authority, not the App project's Supabase Auth.

Therefore App-project authorization MUST NOT assume that `auth.uid()` in the App project represents the NamyKids parent.

Protected App-runtime access goes through a trusted App backend boundary that verifies the Web access token and derives `parent_user_id` from the verified token subject.

## Data API posture

Default posture for App runtime tables:
- no direct mobile INSERT/UPDATE/DELETE;
- no direct mobile SELECT for private runtime data unless a later gate explicitly approves a safe read surface;
- grants are opt-in, not inherited broadly;
- RLS remains enabled on exposed tables as defense in depth;
- private/internal schemas remain unexposed.

## Authority / access matrix

| Entity | Direct mobile Data API | Backend/API read | Backend/API write | Canonical authority |
|---|---|---|---|---|
| app.identity_binding | DENY | verified parent only | provisioning/revocation only | App binding of Web identity |
| app.entitlement_snapshot | DENY | verified parent only | trusted sync/refresh only | Web entitlement, App cache |
| app.device_registration | DENY | verified parent only | trusted device service | App |
| content.content_release | optional read-only published surface later | yes | admin/content pipeline only | App |
| content.content_node_version | optional read-only published surface later | yes | admin/content pipeline only | App |
| app.activity_attempt | DENY | verified parent/child only | Completion Commit only | App |
| app.activity_result | DENY | verified parent/child only | Completion Commit only | App |
| app.progress_projection | DENY by default | verified parent/child only | Completion Commit/projection only | App |
| app.resume_pointer | DENY by default | verified parent/child only | Completion Commit/runtime service | App |
| private.domain_outbox | DENY | privileged worker only | privileged transaction/worker only | App |

## Identity enforcement

- Client must never supply a trusted `parent_user_id`.
- Trusted backend verifies Web token first.
- Verified JWT `sub` becomes `parent_user_id`.
- `child_id` is accepted only after server-side ownership validation against `app.identity_binding`.
- Cross-project IDs are scalar UUIDs, not foreign keys to the Web database.

## Database hardening

- Revoke unnecessary grants from `anon`, `authenticated`, and PUBLIC.
- Do not create a permissive `TO authenticated USING (true)` policy.
- If any App table is exposed later, add explicit least-privilege GRANT + RLS together.
- Functions callable through Data API must have explicit EXECUTE grants.
- SECURITY DEFINER is exceptional only; if used, keep fixed `search_path`, perform explicit authorization, revoke PUBLIC execute, and run security advisors.
- Mobile clients use only publishable keys; service/secret credentials remain server-side.

## Completion Commit

Protected completion mutation is server-mediated:
1. verify Web token;
2. derive parent identity;
3. verify active parent↔child binding;
4. verify entitlement/content/release rules;
5. execute atomic attempt + result + progress + resume + outbox transaction;
6. enforce idempotency by completion ID.

## Acceptance tests

- App-project `auth.uid()` is not used as the NamyKids parent authority.
- Parent A token cannot access Parent B binding/device/runtime rows.
- Client-supplied parent UUID is ignored/rejected.
- Invalid/expired Web token produces zero App DB writes.
- Unverified child UUID produces zero App DB writes.
- Mobile publishable-key client cannot directly mutate runtime tables.
- Duplicate completion ID produces no duplicate result/progress/outbox.
- Published content access works only through the explicitly approved surface.
- Security advisor has no new App-project warning caused by migration.

## Migration gate condition

This draft becomes canonical only after:
- schema/migration is created through approved Supabase migration workflow;
- Web-token verification method is tested;
- grants and RLS/API exposure are verified;
- transaction/idempotency tests pass;
- security/performance advisors pass with no new material findings.

