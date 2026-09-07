import assert from "node:assert/strict";
import { registerStudent } from "../src/store.json.js";

const base = {
  name: "New Student",
  email: "newstudent@campus.edu",
  password: "student123",
  rollNo: "CS99B9999",
  phone: "+91-9000099999",
};

try {
  await assert.rejects(
    () => registerStudent({ ...base, email: "ananya@campus.edu" }),
    /already exists/i,
    "duplicate email should be rejected"
  );

  await assert.rejects(
    () => registerStudent({ ...base, rollNo: "CS22B1047" }),
    /already exists|already registered/i,
    "duplicate roll number should be rejected"
  );

  await assert.rejects(
    () => registerStudent({ ...base, phone: "+91-7700010101" }),
    /already exists|already registered/i,
    "duplicate phone should be rejected"
  );

  console.log("registration conflict checks passed");
} catch (error) {
  console.error("registration conflict checks failed");
  console.error(error);
  process.exit(1);
}
