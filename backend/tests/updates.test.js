import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { appointmentInstant, isFutureAppointment } from "../utils/appointmentTime.js";
import { isFutureAppointment as isFutureClientAppointment } from "../../frontend/src/utils/appointmentTime.js";
import { createAppointment } from "../controllers/appointmentController.js";
import { buildAvailability } from "../controllers/scheduleController.js";
import { registerUser, updateUserStatus, getCurrentUser } from "../controllers/userController.js";
import { createMedicine, updateMedicine, createInventoryTransaction } from "../controllers/medicineController.js";
import { updateService } from "../controllers/serviceController.js";
import Appointment from "../models/Appointment.js";
import ClinicSchedule from "../models/ClinicSchedule.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Medicine from "../models/Medicine.js";
import Notification from "../models/Notification.js";
import InventoryTransaction from "../models/InventoryTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Service from "../models/Service.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const medicineId = "507f1f77bcf86cd799439011";
afterEach((context) => context.mock.restoreAll());

test("November 16 at 10:16 PM rejects 4 PM and accepts tomorrow in Philippine time", () => {
  const now = new Date("2026-11-16T22:16:00+08:00");
  for (const check of [isFutureAppointment, isFutureClientAppointment]) {
    assert.equal(check("2026-11-16", "16:00", now), false);
    assert.equal(check("2026-11-16", "22:16", now), false);
    assert.equal(check("2026-11-17", "08:00", now), true);
    assert.equal(check("2026-11-16", "22:17", now), true);
  }
  assert.equal(appointmentInstant("2026-11-16", "16:00").toISOString(), "2026-11-16T08:00:00.000Z");
});

test("malformed and impossible dates and times are rejected", () => {
  for (const [date, time] of [["2026-02-30", "16:00"], ["2026-11-16", "25:00"], ["2026-11-16", "4PM"], ["invalid", "16:00"]]) {
    assert.equal(appointmentInstant(date, time), null);
  }
});

test("appointment API rejects an elapsed time before accessing patient data", async (context) => {
  const query = context.mock.method(Patient, "findOne", () => { throw new Error("Must not query patient"); });
  const res = response();
  await createAppointment({ body: { serviceId: medicineId, appointmentDate: "2000-01-01", appointmentTime: "16:00" } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /future.*Philippine/);
  assert.equal(query.mock.callCount(), 0);
});

test("today's availability excludes elapsed slots and occupied future slots", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-16T15:15:00+08:00").getTime() });
  context.mock.method(ClinicSchedule, "findOne", async () => ({ weeklyHours: [{ dayOfWeek: 1, isOpen: true, openTime: "14:00", closeTime: "17:00" }], closedDates: [], slotMinutes: 30 }));
  context.mock.method(Appointment, "find", () => ({ distinct: async () => ["16:00"] }));
  const availability = await buildAvailability("2026-11-16");
  assert.deepEqual(availability.slots.filter((slot) => slot.available).map((slot) => slot.time), ["15:30", "16:30"]);
  assert.equal(availability.slots.find((slot) => slot.time === "14:00").elapsed, true);
});

test("after clinic hours there are no available times today; tomorrow remains available", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-16T22:16:00+08:00").getTime() });
  context.mock.method(ClinicSchedule, "findOne", async () => ({ weeklyHours: [1, 2].map((dayOfWeek) => ({ dayOfWeek, isOpen: true, openTime: "08:00", closeTime: "17:00" })), closedDates: [], slotMinutes: 30 }));
  context.mock.method(Appointment, "find", () => ({ distinct: async () => [] }));
  assert.equal((await buildAvailability("2026-11-16")).slots.some((slot) => slot.available), false);
  assert.equal((await buildAvailability("2026-11-17")).slots.every((slot) => slot.available), true);
});

test("registration stores individual names and derives the existing display name", async (context) => {
  context.mock.method(User, "findOne", async () => null);
  let saved;
  context.mock.method(User, "create", async (value) => { saved = value; return value; });
  const res = response();
  await registerUser({ firebaseUser: { uid: "test-uid", email: "test@example.invalid", authTime: 123 }, body: { firstName: " juan ", secondName: "carlos", middleName: "santos", lastName: "cruz", suffix: "Jr.", privacyConsent: true } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(saved.firstName, "Juan");
  assert.equal(saved.secondName, "Carlos");
  assert.equal(saved.middleName, "Santos");
  assert.equal(saved.lastName, "Cruz");
  assert.equal(saved.suffix, "Jr.");
  assert.equal(saved.fullName, "Juan Carlos Santos Cruz Jr.");
});

test("first and last name are required; secondary names and suffix are optional", async (context) => {
  context.mock.method(User, "findOne", async () => null);
  context.mock.method(User, "create", async (value) => value);
  const res = response();
  await registerUser({ firebaseUser: { uid: "test", email: "test@example.invalid" }, body: { firstName: "Juan", lastName: "Cruz", privacyConsent: true } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.fullName, "Juan Cruz");
  const invalid = response();
  await registerUser({ firebaseUser: { uid: "test", email: "test@example.invalid" }, body: { firstName: " ", lastName: "Cruz", privacyConsent: true } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test("existing accounts still sign in without newly split names", async (context) => {
  context.mock.method(User, "findOne", async () => ({ fullName: "Existing Account" }));
  const res = response();
  await registerUser({ firebaseUser: { uid: "old" }, body: { fullName: "Existing Account" } }, res);
  assert.equal(res.statusCode, 409);
});

test("profile readiness is returned without a separate missing-patient request", async (context) => {
  context.mock.method(User, "findById", () => ({ select: async () => ({ _id: "patient", role: "patient" }) }));
  context.mock.method(Patient, "exists", async () => null);
  const res = response();
  await getCurrentUser({ user: { id: "patient" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.hasPatientProfile, false);
});

test("inactive remarks are saved, audited, editable, and cleared on reactivation", async (context) => {
  const account = { _id: "other", fullName: "Test Account", email: "test@example.invalid", status: "active", save: async () => {} };
  context.mock.method(User, "findById", async () => account);
  const audit = context.mock.method(ActivityLog, "create", async (value) => value);
  for (const remark of ["  Duplicate account  ", "User requested deactivation"]) {
    const res = response();
    await updateUserStatus({ user: { id: "admin" }, params: { id: "other" }, body: { status: "inactive", statusRemark: remark } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.statusRemark, remark.trim());
  }
  assert.match(audit.mock.calls[0].arguments[0].description, /Duplicate account/);
  const res = response();
  await updateUserStatus({ user: { id: "admin" }, params: { id: "other" }, body: { status: "active" } }, res);
  assert.equal(account.statusRemark, "");
});

test("self-deactivation and oversized remarks are rejected", async () => {
  const res = response();
  await updateUserStatus({ user: { id: "admin" }, params: { id: "admin" }, body: { status: "inactive" } }, res);
  assert.equal(res.statusCode, 400);
  const invalid = response();
  await updateUserStatus({ user: { id: "admin" }, params: { id: "other" }, body: { status: "inactive", statusRemark: "x".repeat(501) } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

const stockFixture = (context, quantity = 12) => {
  const medicine = { _id: medicineId, medicineName: "Test Medicine", unit: "tablets", quantity, minimumStock: 10, status: "available", save: async () => {} };
  const notices = [];
  context.mock.method(Medicine, "findById", async () => medicine);
  context.mock.method(User, "find", (query) => {
    assert.deepEqual(query, { role: { $in: ["admin", "staff"] }, status: "active" });
    return { select: async () => [{ _id: "admin" }, { _id: "staff" }] };
  });
  context.mock.method(Notification, "insertMany", async (values) => { notices.push(...values); });
  context.mock.method(InventoryTransaction, "create", async (value) => value);
  context.mock.method(ActivityLog, "create", async (value) => value);
  return { medicine, notices };
};

test("stock depletion alerts staff at the threshold and out of stock without repeated low warnings", async (context) => {
  const { medicine, notices } = stockFixture(context);
  const transact = async (quantity, transactionType = "stock-out") => {
    const res = response();
    await createInventoryTransaction({ params: { id: medicineId }, user: { id: "admin" }, body: { transactionType, quantity, reason: "Test stock change" } }, res);
    assert.equal(res.statusCode, 201);
  };
  await transact(2);
  assert.equal(medicine.status, "low-stock");
  assert.equal(notices.length, 2);
  assert.match(notices[0].message, /10 tablets.*10/);
  await transact(1);
  assert.equal(notices.length, 2);
  await transact(9);
  assert.equal(medicine.status, "out-of-stock");
  assert.equal(notices.length, 4);
  await transact(20, "stock-in");
  assert.equal(medicine.status, "available");
  await transact(10);
  assert.equal(notices.length, 6);
});

test("raising the low-stock threshold emits an alert and editing details does not repeat it", async (context) => {
  const { notices } = stockFixture(context);
  const res = response();
  await updateMedicine({ params: { id: medicineId }, body: { minimumStock: 15 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(notices.length, 2);
  await updateMedicine({ params: { id: medicineId }, body: { description: "Updated details" } }, response());
  assert.equal(notices.length, 2);
});

test("adding medicine already low on stock emits an alert", async (context) => {
  const { medicine, notices } = stockFixture(context);
  context.mock.method(Medicine, "create", async (value) => ({ ...medicine, ...value }));
  const res = response();
  await createMedicine({ body: { medicineName: "Test Medicine", unit: "tablets", quantity: 5, minimumStock: 10 } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(notices.length, 2);
});

test("service updates preserve the service ID used by existing appointments", async (context) => {
  let updated;
  context.mock.method(Service, "findByIdAndUpdate", async (id, fields, options) => {
    assert.equal(options.runValidators, true);
    updated = { _id: id, ...fields };
    return updated;
  });
  const res = response();
  await updateService({ params: { id: medicineId }, body: { serviceName: "Updated Consultation", category: "Consultation", description: "Updated information", requirements: ["Health card"], availability: "unavailable" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(updated._id, medicineId);
  assert.equal(updated.serviceName, "Updated Consultation");
  assert.deepEqual(updated.requirements, ["Health card"]);
  assert.equal(updated.availability, "unavailable");
});
