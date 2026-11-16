import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy.js";
import { isValidPassword as isValidClientPassword, getPasswordRequirements, PASSWORD_POLICY_MESSAGE as CLIENT_MESSAGE } from "../../frontend/src/utils/passwordPolicy.js";

const cases = [
  ["Aa1!xx", true], // Six-character boundary.
  ["Aa1!xxx", true],
  ["Aa1!xxxx", true],
  ["Aa1!xxxxx", true],
  ["Aa1!xxxxxx", true], // Ten-character boundary.
  ["Ab1_xyz", true],
  ["Aa1! x", true], // Passwords are checked without trimming or rewriting them.
  ["Aa1!x", false],
  ["Aa1!xxxxxxx", false],
  ["aaaaa1!", false],
  ["AAAAA1!", false],
  ["Aaaaaa!", false],
  ["Aaaaaa1", false],
  ["Aaaaa1 ", false], // A space is not a special character.
  ["Aa1éxx", false], // A letter is not punctuation or a symbol.
  ["", false],
  [undefined, false],
  [null, false],
  [123456, false],
  [{ password: "Aa1!xx" }, false]
];

test("password policy enforces every required character category and the 6–10 boundaries", () => {
  for (const [value, expected] of cases) assert.equal(isValidPassword(value), expected, `Unexpected policy result for ${typeof value}`);
});

test("client and server password rules and error messages agree", () => {
  assert.equal(CLIENT_MESSAGE, PASSWORD_POLICY_MESSAGE);
  for (const [value, expected] of cases) assert.equal(isValidClientPassword(value), expected);
});

test("the visible checklist reports individual unmet requirements", () => {
  const missingNumber = getPasswordRequirements("Abcdef!");
  assert.deepEqual(missingNumber.filter(({ met }) => !met).map(({ id }) => id), ["number"]);
  assert.equal(getPasswordRequirements("Aa1!xx").every(({ met }) => met), true);
  assert.equal(getPasswordRequirements().every(({ met }) => !met), true);
});
