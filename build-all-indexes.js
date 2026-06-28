/**
 * build-all-indexes.js
 * Ensures all critical MongoDB indexes exist for maximum query performance.
 * Safe to run multiple times (idempotent).
 *
 * Usage: node build-all-indexes.js
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

  async function ensureIndexes(collectionName, indexes) {
    try {
      const col = db.collection(collectionName);
      for (const { key, options } of indexes) {
        await col.createIndex(key, { background: true, ...options });
      }
      console.log(`  ✅  ${collectionName}`);
    } catch (err) {
      console.warn(`  ⚠️   ${collectionName}: ${err.message}`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧  Building indexes …");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Users
  await ensureIndexes("users", [
    { key: { email: 1, school_id: 1 }, options: { unique: true } },
    { key: { school_id: 1, role: 1 } },
  ]);

  // Students
  await ensureIndexes("students", [
    { key: { school_id: 1 } },
    { key: { school_id: 1, class_id: 1 } },
    { key: { school_id: 1, name: 1 } },
    { key: { school_id: 1, is_active: 1 } },
    { key: { school_id: 1, createdAt: -1 } },
    { key: { school_id: 1, admission_no: 1 } },
    { key: { parent_id: 1 } },
    { key: { user_id: 1 } },
  ]);

  // Teachers
  await ensureIndexes("teachers", [
    { key: { school_id: 1 } },
    { key: { school_id: 1, name: 1 } },
    { key: { school_id: 1, is_active: 1 } },
    { key: { school_id: 1, createdAt: -1 } },
    { key: { user_id: 1 } },
  ]);

  // Classes
  await ensureIndexes("classes", [
    { key: { school_id: 1 } },
    { key: { school_id: 1, name: 1, section: 1, academic_year: 1 }, options: { unique: true } },
    { key: { school_id: 1, academic_year: 1 } },
  ]);

  // Parents
  await ensureIndexes("parents", [
    { key: { school_id: 1 } },
    { key: { user_id: 1 } },
  ]);

  // Notices
  await ensureIndexes("notices", [
    { key: { school_id: 1, createdAt: -1 } },
    { key: { school_id: 1, is_published: 1 } },
  ]);

  // Holidays
  await ensureIndexes("holidays", [
    { key: { school_id: 1, date: 1 } },
  ]);

  // Subjects
  await ensureIndexes("subjects", [
    { key: { school_id: 1, class_id: 1 } },
  ]);

  // Attendance
  await ensureIndexes("attendances", [
    { key: { school_id: 1, class_id: 1, date: 1 } },
  ]);

  // Exams
  await ensureIndexes("exams", [
    { key: { school_id: 1, class_id: 1 } },
  ]);

  // Results
  await ensureIndexes("results", [
    { key: { school_id: 1, student_id: 1 } },
    { key: { school_id: 1, exam_id: 1 } },
  ]);

  // Fee related
  await ensureIndexes("feepayments", [
    { key: { school_id: 1, student_id: 1 } },
    { key: { school_id: 1, transaction_date: -1 } },
  ]);

  // Leave Requests
  await ensureIndexes("leaverequests", [
    { key: { school_id: 1, status: 1 } },
    { key: { school_id: 1, user_id: 1 } },
  ]);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  All indexes built successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
