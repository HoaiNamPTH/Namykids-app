# NamyKids App — RLS Mapping v1.0 DRAFT

Status: DRAFT / NOT APPLIED
Date: 2026-09-21

## Security invariants
- One auth account owns one child profile.
- Progress belongs to child; entitlement belongs to account.
- Published content is immutable and release-pinned.
- Client uses publishable key only; never service-role/secret.
- No device fingerprint, Advertising ID/IDFA, or child PII as technical keys.
- Engines/screens do not own persistence.
- Completion mutation goes through one transactional Completion Commit boundary.

## RLS matrix

| Entity | Client SELECT | Client INSERT | Client UPDATE | Client DELETE | Mutation owner |
|---|---|---|---|---|---|
| public.profiles | own account only | existing canonical flow | own allowed fields only | controlled deletion flow | existing shared auth/account contract |
| public.child_profiles | own child only | existing canonical flow | parent-owned only | parent-gated deletion flow | existing shared contract |
| content.content_release | published only | none | none | none | admin/content pipeline |
| content.content_node_version | nodes in published release only | none | none | none | admin/content pipeline |
| app.device_registration | own account | own account | own account | revoke, not direct delete | server/device registration flow |
| app.activity_attempt | own child | none | none | none | Completion Commit |
| app.activity_result | own child | none | none | none | Completion Commit |
| app.progress_projection | own child | none | none | none | Completion Commit/projection |
| app.resume_pointer | own child | none | none | none | Completion Commit/runtime service |
| private.domain_outbox | none | none | none | none | privileged server worker only |

## Migration-gate conditions
- New RLS policies must use ownership predicates, not only TO authenticated.
- UPDATE policies require USING + WITH CHECK.
- Use (select auth.uid()) where appropriate to avoid per-row re-evaluation warnings.
- SECURITY DEFINER, if genuinely required, must use fixed search_path, explicit ownership checks, least-privilege EXECUTE grants, and advisor review.
- private schema must remain unexposed.
- Legacy progress/runtime writes must have an explicit cutover so there is one canonical progress truth.

## Acceptance tests
- Parent A cannot read Parent B child/runtime/device rows.
- Unauthenticated user cannot invoke Completion Commit.
- Authenticated client cannot directly mutate attempt/result/progress/resume.
- Duplicate completion IDs remain idempotent.
- Published content is readable; draft content is not.
