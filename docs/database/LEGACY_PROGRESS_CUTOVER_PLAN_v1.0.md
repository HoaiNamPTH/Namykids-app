# NamyKids App — Legacy Progress Cutover Plan v1.0

Status: PENDING HUMAN DECISION
Date: 2026-09-21
Scope: Web progress sources only. This plan does not alter the Web Supabase schema or data.

## Objective

After App launch, App runtime progress has one writable authority: the App Supabase project.
The Web project must not continue as a parallel writable truth for App-runtime progress.

## Required classification

| Web source                 | Classification                    | Reason                                                                                                         |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Web.lesson_progress`      | UNKNOWN — HUMAN DECISION REQUIRED | Data age, retention obligation, and whether historical learning must appear in the App have not been approved. |
| `Web.game_sessions`        | UNKNOWN — HUMAN DECISION REQUIRED | The equivalence between legacy Web game sessions and App runtime attempts/results has not been approved.       |
| `Web.activity_completions` | UNKNOWN — HUMAN DECISION REQUIRED | The historical completion mapping and idempotency reconciliation rule have not been approved.                  |

## Decision options

For each source, the release owner must choose exactly one of:

- `ARCHIVE READ-ONLY`: retain historical Web rows for audit/Parent Hub display, disable new App-runtime writes, and expose only controlled reads.
- `MIGRATE`: map records into the App attempt/result model with an approved lineage and idempotency strategy, then disable new Web runtime writes.
- `RETIRE`: confirm no retention or product requirement exists, then follow the separately approved deletion/retention process.

## Preconditions before App launch

1. Record the classification and approving owner for each table.
2. If `MIGRATE`, approve a field-level mapping, deduplication key, rollback plan, and reconciliation report.
3. If `ARCHIVE READ-ONLY`, disable/redirect App-runtime writers on Web without deleting data.
4. Verify the App project is the sole writable runtime progress truth after cutover.
5. Keep Parent Hub consumption read/integration-only unless a separate architecture decision approves writes.

## Non-actions in this artifact

- No Web migration is created.
- No Web progress data is deleted, copied, or transformed.
- No classification is inferred from table names alone.
