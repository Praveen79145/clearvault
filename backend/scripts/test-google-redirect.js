import { homeFor, resolveUserHome } from "../src/auth.js";

let passed = 0;
let failed = 0;

const t = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✘ ${name}\n      ${err.message}`);
  }
};

const expect = (cond, msg) => {
  if (!cond) throw new Error(msg || "expectation failed");
};

console.log("\nGoogle redirect target selection\n─────────────────────────────────");

t("student users route to /student", () => {
  expect(homeFor("STUDENT") === "/student", "student route should be /student");
  expect(resolveUserHome({ role: "STUDENT" }) === "/student", "resolveUserHome should return /student");
});

t("staff users route to /staff", () => {
  expect(homeFor("STAFF") === "/staff", "staff route should be /staff");
  expect(resolveUserHome({ role: "STAFF" }) === "/staff", "resolveUserHome should return /staff");
});

t("authority aliases route to /staff", () => {
  expect(homeFor("AUTHORITY") === "/staff", "AUTHORITY should resolve to the authority dashboard");
  expect(resolveUserHome({ role: "AUTHORITY" }) === "/staff", "resolveUserHome should handle AUTHORITY");
});

t("admin users route to /admin", () => {
  expect(homeFor("ADMIN") === "/admin", "admin route should be /admin");
  expect(resolveUserHome({ role: "ADMIN" }) === "/admin", "resolveUserHome should return /admin");
});

t("unknown users fall back to /login", () => {
  expect(resolveUserHome(null) === "/login", "missing user should not redirect to /");
  expect(resolveUserHome({ role: undefined }) === "/login", "undefined role should not redirect to /");
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
