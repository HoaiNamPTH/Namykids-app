import assert from "node:assert/strict";

const endpoint = process.env.VERIFY_WEB_SESSION_URL;
const validToken = process.env.WEB_VALID_ACCESS_TOKEN;
const expectedParent = process.env.WEB_VALID_PARENT_ID;
const expiredToken = process.env.WEB_EXPIRED_ACCESS_TOKEN;
const unrelatedToken = process.env.WEB_UNRELATED_PROJECT_ACCESS_TOKEN;
const childA = process.env.APP_BOUND_CHILD_ID;
const childB = process.env.APP_UNBOUND_CHILD_ID;

const missing = [
  endpoint,
  validToken,
  expectedParent,
  expiredToken,
  unrelatedToken,
  childA,
  childB,
].some((value) => !value);
if (missing) {
  console.log(
    "BLOCKED — needs real Web/App non-production test session and identity bindings.",
  );
  process.exit(0);
}

async function call(token, body) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const valid = await call(validToken, {
  child_id: childA,
  parent_user_id: "00000000-0000-0000-0000-000000000000",
});
assert.equal(
  valid.status,
  200,
  "valid Web token and bound child must be accepted",
);
assert.equal(
  (await valid.json()).parent_user_id,
  expectedParent,
  "client parent_user_id must be ignored",
);

assert.equal(
  (await call(expiredToken, {})).status,
  401,
  "expired token must be rejected",
);
assert.equal(
  (await call("corrupted.token.value", {})).status,
  401,
  "corrupted token must be rejected",
);
assert.equal(
  (await call(unrelatedToken, {})).status,
  401,
  "unrelated-project token must be rejected",
);
assert.equal(
  (await fetch(endpoint, { method: "POST" })).status,
  401,
  "missing Authorization must be rejected",
);
assert.equal(
  (await call(validToken, { child_id: childB })).status,
  403,
  "unbound child must be rejected",
);

console.log("PASS — verify-web-session integration harness");
