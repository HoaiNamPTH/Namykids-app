import { describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({ default: { getItem: async () => null, setItem: async () => undefined } }));

import { accessFor, DAY_MS, FREE_GAME_IDS, TRIAL_DAYS, freeGamesAreReal } from "../src/play/account/access";
import { signIn, signOut, signUp } from "../src/play/account/account";
import { sha256 } from "../src/play/account/sha256";

describe("account and trial", () => {
  it("sha256 matches reference values, including Vietnamese and emoji", () => {
    // Reference values from Node's crypto.createHash("sha256").
    expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256("mật khẩu của bố mẹ 😊")).toBe("920b9cc0ac6ad18e4c64124cc8d7d9619724e7488bb5807edce9a1873d78ba7a");
    expect(sha256("x".repeat(130))).toBe("3afbb132863c57f08bdc32205eb6c63775397a9953819218a1f4b7cbdc0ff90f");
  });

  it("gives FULL access for 7 days, then LIMITED to the free list", () => {
    expect(TRIAL_DAYS).toBe(7);
    const start = 1_000_000_000_000;
    const day1 = accessFor(start, start + 1000);
    expect(day1.plan).toBe("trial");
    expect(day1.daysLeft).toBe(7);
    expect(day1.canPlay("lat-the-tim-cap")).toBe(true);
    expect(accessFor(start, start + 6.5 * DAY_MS).daysLeft).toBe(1);
    const after = accessFor(start, start + 7 * DAY_MS + 1);
    expect(after.plan).toBe("limited");
    expect(after.canPlay(FREE_GAME_IDS[0]!)).toBe(true);
    expect(after.canPlay("lat-the-tim-cap")).toBe(false);
    expect(accessFor(start, start + 30 * DAY_MS, true).canPlay("lat-the-tim-cap")).toBe(true);
    expect(freeGamesAreReal()).toBe(true);
  });

  it("signs up, remembers, rejects a wrong password, signs back in", () => {
    expect(signUp("bo me@x", "123456")).toBe("email");
    expect(signUp("Bo.Me@Example.com", "123")).toBe("password-short");
    expect(signUp("Bo.Me@Example.com", "matkhau1")).toBeNull();
    signOut();
    expect(signIn("bo.me@example.com", "sai")).toBe("wrong-password");
    expect(signIn("khac@example.com", "matkhau1")).toBe("no-account");
    expect(signIn(" BO.ME@example.com ", "matkhau1")).toBeNull();
  });
});
