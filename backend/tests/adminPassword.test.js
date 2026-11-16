import assert from "node:assert/strict";
import { test } from "node:test";
import { createSetUserPassword } from "../controllers/adminPasswordController.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

const adminId = "507f1f77bcf86cd799439011";
const targetId = "507f1f77bcf86cd799439012";
const password = "Example1!";
const request = (overrides = {}) => ({ user: { id: adminId, role: "admin" }, params: { id: targetId }, body: { password }, ...overrides });
const response = () => ({
  statusCode: 200, headers: {},
  set(name, value) { this.headers[name] = value; return this; },
  status(value) { this.statusCode = value; return this; },
  json(value) { this.body = value; return this; }
});

test("password updates require an authenticated admin before looking up an account", async (context) => {
  const lookup = context.mock.method(User, "findById", async () => { throw new Error("Unauthorized lookup"); });
  let updates = 0;
  const handler = createSetUserPassword({ updateUser: async () => { updates += 1; } });
  for (const user of [undefined, { id: adminId, role: "patient" }, { id: adminId, role: "staff" }]) {
    const res = response();
    await handler(request({ user }), res);
    assert.equal(res.statusCode, user ? 403 : 401);
  }
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal(updates, 0);
});

test("route authorization rejects staff and patients and permits admins", () => {
  const middleware = authorizeRoles("admin");
  for (const role of ["patient", "staff", "admin"]) {
    const res = response();
    let permitted = false;
    middleware(request({ user: { id: adminId, role } }), res, () => { permitted = true; });
    assert.equal(permitted, role === "admin");
    if (!permitted) assert.equal(res.statusCode, 403);
  }
});

test("rejects malformed IDs, self changes, and invalid passwords before calling Firebase", async (context) => {
  const lookup = context.mock.method(User, "findById", async () => { throw new Error("Invalid lookup"); });
  const handler = createSetUserPassword({ updateUser: async () => { throw new Error("Must not update"); } });
  const cases = [request({ params: { id: "bad-id" } }), request({ params: { id: adminId } })];
  for (const value of [undefined, null, {}, true, "Ab1!x", "Ab1!xyz7890", "abcdef1!", "ABCDEF1!", "Abcdefg!", "Abcdef12", "Abcde1 "]) cases.push(request({ body: { password: value } }));
  for (const req of cases) {
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(lookup.mock.callCount(), 0);
});

test("a missing local account returns 404 without updating authentication", async (context) => {
  context.mock.method(User, "findById", async () => null);
  let updated = false;
  const handler = createSetUserPassword({ updateUser: async () => { updated = true; } });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 404);
  assert.equal(updated, false);
});

test("admins can set other account passwords using their stored Firebase UID without changing roles or status", async (context) => {
  const updates = [];
  const audits = [];
  let account;
  context.mock.method(User, "findById", async (id) => { assert.equal(id, targetId); return account; });
  context.mock.method(ActivityLog, "create", async (entry) => { audits.push(entry); });
  const handler = createSetUserPassword({ updateUser: async (...args) => { updates.push(args); } });
  for (const role of ["patient", "staff", "admin"]) {
    account = { _id: targetId, firebaseUid: "selected-firebase-uid", fullName: "Test Account", email: "test@example.invalid", role, status: "inactive" };
    const before = { ...account };
    const res = response();
    await handler(request({ body: { password, firebaseUid: "untrusted-uid" } }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.headers["Cache-Control"], "no-store");
    assert.deepEqual(updates.at(-1), ["selected-firebase-uid", { password }]);
    assert.deepEqual(account, before);
    assert.equal(audits.at(-1).userId, adminId);
    assert.equal(audits.at(-1).targetId, targetId);
    assert.equal(audits.at(-1).action, "Set account password");
    assert.ok(!JSON.stringify(audits).includes(password));
    assert.ok(!JSON.stringify(res.body).includes(password));
  }
});

test("password rules and missing Firebase accounts produce usable errors without recording success", async (context) => {
  context.mock.method(User, "findById", async () => ({ _id: targetId, firebaseUid: "test-uid" }));
  const audit = context.mock.method(ActivityLog, "create", async () => {});
  for (const [code, expected] of [["auth/invalid-password", 400], ["auth/password-does-not-meet-requirements", 400], ["auth/user-not-found", 404]]) {
    const handler = createSetUserPassword({ updateUser: async () => { throw Object.assign(new Error(password), { code }); } });
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, expected);
    assert.ok(!JSON.stringify(res.body).includes(password));
  }
  assert.equal(audit.mock.callCount(), 0);
});

test("unexpected Firebase failures do not expose the password in responses or logs", async (context) => {
  context.mock.method(User, "findById", async () => ({ _id: targetId, firebaseUid: "test-uid" }));
  const logger = context.mock.method(console, "error", () => {});
  const handler = createSetUserPassword({ updateUser: async () => { throw Object.assign(new Error(password), { code: "auth/internal-error" }); } });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 500);
  assert.ok(!JSON.stringify(res.body).includes(password));
  assert.ok(!JSON.stringify(logger.mock.calls.map((call) => call.arguments)).includes(password));
});
