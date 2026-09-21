# APP-TECH-03C — NamyKids App Schema Contract v1.0

Status: PASS / MIGRATION NOT YET APPLIED
Date: 2026-09-21
Target project: Namykids app (oohseaqfwvekrwyfelrf)
Depends on: APP-TECH-03A, APP-TECH-03B, APP-ARCH-01 v1.2, APP-ARCH-02 v1.0

## 1. Design principles

- Separate App database from Web database.
- Reuse Web identity keys; do not create a second customer account truth.
- Keep runtime writes server-mediated.
- One canonical App progress truth after cutover.
- Immutable content/release pinning for reproducible learning sessions.
- Idempotent completion commit.
- Minimal PII in App project.
- No direct FK to Web project because databases are separate.

## 2. Schemas

### app
Private-by-default runtime domain.

### content
Versioned App learning content metadata/config.

### private
Internal outbox/integration helpers; never exposed to mobile Data API.

## 3. Core tables

### app.identity_binding
Purpose: trusted mapping of verified Web parent and child IDs.

Columns:
- parent_user_id uuid NOT NULL
- child_id uuid NOT NULL
- source text NOT NULL DEFAULT 'web'
- source_verified_at timestamptz NOT NULL
- source_revision text NULL
- status text NOT NULL CHECK active|revoked
- created_at timestamptz NOT NULL
- updated_at timestamptz NOT NULL

Key:
- PRIMARY KEY (parent_user_id, child_id)
- UNIQUE child_id while status is active, because Product contract is 1 account = 1 child for current baseline.

No email, phone, nickname or child PII required.

### app.entitlement_snapshot
Purpose: App cache of Web LIMITED/FULL authority.

Columns:
- parent_user_id uuid PRIMARY KEY
- entitlement text NOT NULL CHECK LIMITED|FULL
- source_revision text NULL
- effective_at timestamptz NOT NULL
- expires_at timestamptz NULL
- refreshed_at timestamptz NOT NULL

Rules:
- server-managed only;
- App cannot promote itself to FULL;
- stale/expired unresolved state fails closed to LIMITED.

### app.device_registration
Purpose: max 2 active App installations per account.

Columns:
- id uuid PRIMARY KEY
- parent_user_id uuid NOT NULL
- installation_id uuid NOT NULL
- platform text NOT NULL CHECK ios|android
- status text NOT NULL CHECK active|revoked
- registered_at timestamptz NOT NULL
- last_seen_at timestamptz NOT NULL
- revoked_at timestamptz NULL

Constraints:
- UNIQUE(parent_user_id, installation_id)
- server transaction enforces max two active devices.
- installation_id is random, not fingerprint/IDFA/Advertising ID/PII.

### content.content_release
Purpose: immutable release envelope.

Columns:
- id uuid PRIMARY KEY
- release_key text UNIQUE NOT NULL
- version integer NOT NULL
- status text NOT NULL CHECK draft|published|retired
- published_at timestamptz NULL
- created_at timestamptz NOT NULL

Rule:
- published release becomes immutable.

### content.content_node_version
Purpose: exact lesson/activity/game config pinned to release.

Columns:
- id uuid PRIMARY KEY
- release_id uuid NOT NULL -> content.content_release.id
- node_key text NOT NULL
- node_type text NOT NULL
- engine_code text NOT NULL
- engine_version text NOT NULL
- payload jsonb NOT NULL
- content_hash text NOT NULL
- created_at timestamptz NOT NULL

Constraints:
- UNIQUE(release_id, node_key)
- production engine_code allowed baseline: E01 SELECT, E02 DRAG_DROP, E04 TRACE.

### app.activity_attempt
Purpose: immutable start/attempt fact.

Columns:
- id uuid PRIMARY KEY
- parent_user_id uuid NOT NULL
- child_id uuid NOT NULL
- release_id uuid NOT NULL
- node_version_id uuid NOT NULL
- attempt_no integer NOT NULL
- started_at timestamptz NOT NULL
- begin_snapshot jsonb NOT NULL
- source text NOT NULL CHECK online|offline
- created_at timestamptz NOT NULL

Constraints:
- ownership validated against active identity binding.
- begin_snapshot pins immutable runtime inputs needed for safe offline completion.

### app.activity_result
Purpose: completed activity result.

Columns:
- id uuid PRIMARY KEY
- attempt_id uuid UNIQUE NOT NULL -> app.activity_attempt.id
- completion_id uuid UNIQUE NOT NULL
- outcome text NOT NULL
- score numeric NULL
- assisted boolean NOT NULL DEFAULT false
- completed_at timestamptz NOT NULL
- result_payload jsonb NOT NULL
- created_at timestamptz NOT NULL

Rule:
- written only by Completion Commit.

### app.progress_projection
Purpose: current progress read model.

Columns:
- child_id uuid NOT NULL
- node_key text NOT NULL
- release_id uuid NOT NULL
- status text NOT NULL
- last_result_id uuid NULL
- updated_at timestamptz NOT NULL

Key:
- PRIMARY KEY(child_id, node_key)

Rule:
- projection only; source facts remain attempt/result.
- no direct client write.

### app.resume_pointer
Purpose: exact resume location/state.

Columns:
- child_id uuid PRIMARY KEY
- release_id uuid NOT NULL
- node_version_id uuid NOT NULL
- engine_code text NOT NULL
- engine_version text NOT NULL
- resume_payload jsonb NOT NULL
- updated_at timestamptz NOT NULL

Rule:
- always pinned to the exact version used at begin time.

### private.domain_outbox
Purpose: reliable cross-project and downstream events.

Columns:
- id uuid PRIMARY KEY
- aggregate_type text NOT NULL
- aggregate_id text NOT NULL
- event_type text NOT NULL
- idempotency_key text UNIQUE NOT NULL
- payload jsonb NOT NULL
- status text NOT NULL CHECK pending|processing|sent|failed
- attempt_count integer NOT NULL DEFAULT 0
- available_at timestamptz NOT NULL
- created_at timestamptz NOT NULL
- sent_at timestamptz NULL

## 4. Logical relationships

- identity_binding authorizes parent_user_id ↔ child_id.
- entitlement_snapshot is parent-scoped.
- device_registration is parent-scoped.
- activity_attempt is child-scoped and release/node-version pinned.
- activity_result is one-to-one with attempt.
- progress_projection and resume_pointer are child-scoped derived/current-state models.
- domain_outbox is created in the same DB transaction as canonical mutations when an integration event must be emitted.

## 5. Completion Commit contract

Input from trusted backend:
- verified parent_user_id
- requested child_id
- completion_id
- release/node/engine pin
- immutable begin snapshot or attempt ID
- result payload

Transaction:
1. verify active identity_binding;
2. verify entitlement if activity requires FULL;
3. verify release/node version;
4. detect prior completion_id;
5. create/find attempt;
6. insert result;
7. update progress projection;
8. update/clear resume pointer;
9. append outbox event;
10. commit.

Duplicate completion_id returns prior committed outcome and creates no duplicate state.

## 6. Index requirements

At minimum index:
- identity_binding(child_id, status)
- device_registration(parent_user_id, status)
- content_node_version(release_id, node_key)
- activity_attempt(child_id, started_at desc)
- activity_attempt(release_id, node_version_id)
- activity_result(completion_id)
- progress_projection(child_id, updated_at desc)
- domain_outbox(status, available_at)

Final index set must be validated by Supabase performance advisor after dry-run.

## 7. Data API exposure

Default:
- app runtime tables: not directly exposed to mobile.
- private schema: never exposed.
- content published read surface: optional and explicit only.

If an exposed read surface is created later, GRANT + RLS must be defined in the same migration and tested.

## 8. Deletion

Account deletion:
- delete/revoke identity_binding
- revoke devices
- delete/anonymize runtime rows per retention contract
- remove entitlement snapshot
- record reconciliation outcome

Child deletion:
- revoke binding immediately
- block new completion writes
- delete/anonymize child-scoped runtime rows per retention contract

Retention durations remain a later policy/legal input if not already approved; no duration is invented here.

## 9. Legacy progress cutover

Web legacy runtime tables are not part of App schema.

Before App release, choose one explicit action for existing Web:
- archive/read-only;
- transform/migrate;
- or retire if not production-relevant.

No dual writable progress authority is allowed.

## 10. Non-goals

- no CMS schema duplication
- no Web SEO/Parent Hub schema duplication
- no payment transaction duplication
- no second Supabase Auth user population
- no analytics warehouse design
- no future engines E03/E05/E06/E07 in production contract

## 11. Acceptance

Schema Contract PASS when:
- every architecture responsibility has one table/boundary;
- identity/commerce duplication is absent;
- completion transaction can be implemented atomically;
- RLS/API strategy is compatible with Web-token verification;
- migration can be generated without reopening architecture.

Decision: APP-TECH-03C PASS.
Next: create canonical migration in approved CLI/non-production context, then dry-run tests and Migration Gate.
