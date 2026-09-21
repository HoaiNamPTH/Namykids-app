# APP-TECH-03B — Web Token Verification Contract v1.0

Status: PASS / IMPLEMENTATION PENDING
Date: 2026-09-21
Depends on: APP-TECH-03A Shared Account & Cross-Project Data Boundary v1.0

## Decision

The App backend verifies NamyKids user identity against the **Web Supabase Auth authority**.

Baseline verification method:

1. Mobile signs in against Web Supabase Auth.
2. Mobile sends the Web access token as `Authorization: Bearer <token>` to the trusted App backend boundary.
3. App backend calls the Web Supabase Auth server using the Web project URL + **publishable key** and validates the token with `getUser(token)` / equivalent Auth user endpoint.
4. Only a successful Auth-server response is accepted.
5. Verified user ID becomes canonical `parent_user_id`.
6. The client is never allowed to override `parent_user_id`.

This baseline does **not** require sharing Web service-role/secret credentials with the App.

## Why this method is baseline

### VERIFIED FACT
- Web Supabase project is the identity authority.
- Web has an active modern publishable key.
- Supabase documentation states `getUser` performs a network call to the project's Auth instance and returns a server-confirmed user record.
- Supabase documentation recommends `getClaims` for verified JWT claims when asymmetric signing is available, while `getUser` remains the reliable validation path when symmetric signing is used.
- Current tooling did not provide conclusive evidence of the Web project's session-token signing mode.

### DERIVED-INFERENCE
Using `getUser` as the baseline avoids making App security depend on an unverified assumption about Web JWT signing mode.

## Optional optimization

If a later verification proves that Web Auth uses asymmetric JWT signing with a working public JWKS:

- App backend may verify tokens locally with `getClaims` / JWKS;
- cache JWKS according to Supabase guidance;
- preserve issuer/audience/expiry/signature checks;
- fall back to Web Auth server verification when local verification is unavailable or uncertain.

This optimization does not change identity authority.

## Request contract

Protected App backend request must include:

- Web access token in Authorization header;
- child ID only as an untrusted requested resource identifier;
- request-specific idempotency/completion ID when applicable.

Client must NOT send:

- trusted parent ID;
- service-role/secret key;
- entitlement level as an authoritative value;
- arbitrary role claims that backend trusts.

## Verification pipeline

1. Extract bearer token.
2. Reject missing/malformed token.
3. Validate token against Web Supabase Auth.
4. Obtain verified Web user ID.
5. Resolve active `app.identity_binding` for requested child.
6. Reject if binding absent/revoked/mismatched.
7. Load/refresh entitlement snapshot when required.
8. Execute authorized runtime operation.
9. Write audit/outbox event when the operation changes canonical App state.

## Failure behavior

- Invalid token → HTTP 401 / zero DB writes.
- Expired token → HTTP 401 / client refreshes session through Web Auth.
- Valid user but wrong child → HTTP 403 / zero DB writes.
- Web Auth temporarily unavailable:
  - no new binding/provisioning;
  - no privileged mutation that cannot safely rely on a still-valid previously verified context;
  - never fail open.
- Entitlement check unavailable and cached entitlement is stale/expired → LIMITED, never FULL.

## Session and deletion considerations

- Account deletion/revocation originates in Web.
- App backend must not assume token revocation is instantaneous solely from local JWT expiry.
- Sensitive operations may require fresh Auth-server validation.
- Account/child deletion integration must revoke bindings and runtime access in App.

## Secrets boundary

Allowed on mobile:
- Web Supabase URL
- Web publishable key
- App public endpoint URL
- App publishable key only if a later direct read surface is explicitly approved

Server-only:
- App secret/service credential
- any privileged integration credential

Web service-role/secret is **not required** for baseline token validation.

## Tests

1. Valid Web token → verified parent ID returned.
2. Expired token → rejected.
3. Corrupted token → rejected.
4. Token from unrelated Supabase project → rejected.
5. Valid Parent A token + Child B → rejected.
6. Client-supplied fake parent ID has no effect.
7. Web Auth outage never upgrades access or permits unverified writes.
8. Token verification result is not cached beyond safe session/token boundaries.
9. No secret/service credential exists in mobile bundle.

## Review trigger

Revisit only if:
- Web Auth signing method is changed;
- OAuth/OIDC authority changes;
- token verification latency becomes material;
- App backend architecture changes away from the approved trusted boundary.

## Decision

APP-TECH-03B: PASS.
APP-TECH-03 overall: IN PROGRESS.
Next: App Schema Contract / migration design.
