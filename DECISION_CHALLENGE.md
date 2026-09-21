# Decision Challenge — Canonical Completion RPC Signature

Status: RESOLVED — IMPLEMENTATION/CANONICALIZATION MISMATCH
Date: 2026-09-21

## Original mismatch

The approved documents define the required `public.commit_activity_completion(...)` behavior but did not publish its exact SQL signature. The first reconstructed migration therefore differed from the existing dry-run function.

## Resolution evidence

CMO audit directly verified the live dry-run signatures in App project `oohseaqfwvekrwyfelrf`:

```text
supabase gen types typescript --project-id oohseaqfwvekrwyfelrf --schema public
```

`public.commit_activity_completion` has exactly these 17 arguments:

```text
p_parent_user_id, p_child_id, p_completion_id, p_release_id, p_node_version_id,
p_attempt_id, p_started_at, p_source, p_begin_snapshot, p_outcome, p_score,
p_assisted, p_completed_at, p_result_payload, p_progress_status,
p_resume_payload, p_requires_full
```

It returns `jsonb`, uses `SECURITY INVOKER`, and has `search_path = ''`. `p_attempt_id`, `p_score`, and `p_resume_payload` are runtime-nullable where stated by the audit.

`public.revoke_app_identity` accepts `p_parent_user_id uuid` and `p_child_id uuid default null`, returning `jsonb`.

## Applied canonicalization

- The canonical migration now matches these live signatures and removes the non-live `p_engine_code`, `p_engine_version`, `p_force_failure`, and revoke-reason arguments.
- Engine pinning is derived from the validated `content.content_node_version` row rather than client-supplied values.
- The forced-rollback test now uses a database constraint failure, preserving the all-or-nothing assertion without changing the live RPC interface.
- This was an implementation/canonicalization mismatch only. APP-ARCH-01 and APP-ARCH-02 remain closed and unchanged.

## Type-generation note

Generated RPC argument nullability is not authoritative over PostgreSQL function signature/runtime semantics. Type generation can represent nullable arguments as non-nullable; the SQL contract above remains authoritative unless an actual TypeScript client cannot call the RPC with `null`.

## Required non-action

Do not apply the canonical migration to the remote App project before CMO review. No App or Web remote schema was changed while resolving this mismatch.
