# NamyKids App

Canonical mobile-app repository for NamyKids.

## Governance status
- APP-ARCH-01 v1.2 — APPROVED / CLOSED
- APP-ARCH-02 v1.0 — APPROVED / CLOSED
- Web and App are separate workstreams and separate repositories.
- No architecture decision may be silently reopened. Material conflicts must raise a DECISION CHALLENGE.

## Current phase
Implementation Preparation:
1. Repo Mapping
2. Supabase migration draft
3. RLS mapping
4. Migration test plan
5. Migration Gate

No production migration or production build is authorized at this phase.

## Repository rules
- Do not commit secrets.
- Do not commit node_modules, build outputs, APK/AAB/IPA, raw design files, ZIP archives, or temporary exports.
- Screens/game engines must not write directly to Supabase; persistence goes through approved data/runtime boundaries.
- Production game engines currently approved: E01 SELECT, E02 DRAG_DROP, E04 TRACE.
