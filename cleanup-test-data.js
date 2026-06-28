/**
 * cleanup-test-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deletes ALL test / demo data from MongoDB.
 *
 * KEEPS:
 *  - Users where role === "super_admin" OR role === "school_admin"
 *  - School documents
 *  - LandingContent documents  (website pages)
 *
 * DELETES EVERYTHING ELSE:
 *  Students, Teachers, Parents, Classes, Subjects, Timetables,
 *  Attendance, Homework, Notices, Grades, Holidays, LeaveTypes,
 *  LeaveRequests, Exams, Results, FeesStructure, FeeGroup, FeeType,
 *  FeeMaster, FeeAllocation, FeePayment, Rooms, Buses, Routes,
 *  TransportAllocations, RolePermissions
 *  + User accounts whose role is teacher / student / parent
 *
 * Usage:
 *   node cleanup-test-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not found in .env");
  process.exit(1);
}

async function main() {
  console.log("🔌  Connecting to MongoDB …");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log("✅  Connected\n");

  const db = mongoose.connection.db;

  // Helper: deleteMany on a collection by name (safe if collection doesn't exist)
  async function clearCollection(name, filter = {}) {
    try {
      const col = db.collection(name);
      const result = await col.deleteMany(filter);
      console.log(`  🗑️   ${name}: deleted ${result.deletedCount} documents`);
    } catch (err) {
      console.warn(`  ⚠️   ${name}: ${err.message}`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧹  Starting cleanup …");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── 1. Delete non-admin User accounts ────────────────────────────
  console.log("▶  Users (teacher / student / parent)");
  await clearCollection("users", {
    role: { $in: ["teacher", "student", "parent"] },
  });

  // ── 2. Core people ────────────────────────────────────────────────
  console.log("\n▶  People");
  await clearCollection("students");
  await clearCollection("teachers");
  await clearCollection("parents");

  // ── 3. Classes ────────────────────────────────────────────────────
  console.log("\n▶  Classes");
  await clearCollection("classes");

  // ── 4. Academic ───────────────────────────────────────────────────
  console.log("\n▶  Academic data");
  await clearCollection("subjects");
  await clearCollection("timetables");
  await clearCollection("attendances");
  await clearCollection("homeworks");
  await clearCollection("exams");
  await clearCollection("results");
  await clearCollection("notices");
  await clearCollection("grades");
  await clearCollection("holidays");
  await clearCollection("leavetypes");
  await clearCollection("leaverequests");
  await clearCollection("rooms");

  // ── 5. Fees ───────────────────────────────────────────────────────
  console.log("\n▶  Fees data");
  await clearCollection("feesstructures");
  await clearCollection("feegroups");
  await clearCollection("feetypes");
  await clearCollection("feemasters");
  await clearCollection("feeallocations");
  await clearCollection("feepayments");

  // ── 6. Transport ─────────────────────────────────────────────────
  console.log("\n▶  Transport data");
  await clearCollection("buses");
  await clearCollection("routes");
  await clearCollection("transportallocations");

  // ── 7. Role permissions ──────────────────────────────────────────
  console.log("\n▶  Role permissions");
  await clearCollection("rolepermissions");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  Cleanup complete!\n");

  // ── Summary of what was kept ──────────────────────────────────────
  const keptUsers = await db.collection("users").countDocuments();
  const keptSchools = await db.collection("schools").countDocuments();
  const keptLanding = await db.collection("landingcontents").countDocuments();

  console.log("📋  Remaining data:");
  console.log(`    Users (super_admin / school_admin): ${keptUsers}`);
  console.log(`    Schools:                            ${keptSchools}`);
  console.log(`    LandingContent (website):           ${keptLanding}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
