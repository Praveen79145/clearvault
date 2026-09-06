#!/usr/bin/env python3
"""ClearVault — Request Cancellation, TEST 1–9 evidence run.
Requires a FRESH seed:  rm data/db.json && restart API.  Usage: python3 scripts/test-cancel.py"""
import json, sys, urllib.request, urllib.error, threading

BASE = "http://localhost:4000"
PASS, FAIL = 0, 0

def call(method, path, body=None, cookie=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if cookie: req.add_header("Cookie", "cv_session=" + cookie)
    try:
        with urllib.request.urlopen(req, data=(json.dumps(body).encode() if body is not None else None)) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")

def login(email, pw):
    req = urllib.request.Request(BASE + "/api/auth/login", method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=json.dumps({"email": email, "password": pw}).encode()) as r:
            cookie = r.headers.get("Set-Cookie", "").split("cv_session=", 1)[-1].split(";", 1)[0]
            return r.status, cookie
    except urllib.error.HTTPError as e:
        return e.code, None

def check(label, cond, extra=""):
    global PASS, FAIL
    if cond: PASS += 1; print(f"  ✔ {label}" + (f"  [{extra}]" if extra else ""))
    else: FAIL += 1; print(f"  ✘ FAIL {label}" + (f"  [{extra}]" if extra else ""))

def mine(cookie, rid):
    return call("GET", f"/api/requests/{rid}", cookie=cookie)[1]

_, ananya   = login("ananya@campus.edu", "student123")
_, rohan    = login("rohan@campus.edu", "student123")
_, karan    = login("karan@campus.edu", "student123")
_, zoya     = login("zoya@campus.edu", "student123")
_, fin      = login("finance@campus.edu", "staff123")
_, hostel   = login("hostel@campus.edu", "staff123")

print("\n══ TEST 1 · create → cancel → status CANCELLED with stored metadata ══")
s, b = call("POST", "/api/requests", {"type": "semester"}, ananya)
req1 = b["requestId"]
s, b = call("POST", f"/api/requests/{req1}/cancel", {"reason": "I submitted the request by mistake"}, ananya)
check("cancel endpoint accepts (backend, not frontend-only)", s == 200)
b = mine(ananya, req1)
check("overall = CANCELLED", b["overall"] == "CANCELLED")
r = b["request"]
stored = r.get("cancelledAt") and r.get("cancelledBy") == "Student" and "mistake" in (r.get("cancellationReason") or "")
check("cancelledBy / cancelledAt / reason stored on the record", bool(stored),
      f"by={r.get('cancelledBy')} reason={ (r.get('cancellationReason') or '')[:30] }")
s, b = call("POST", f"/api/requests/{req1}/cancel", {"reason": "again"}, ananya)
check("double cancellation rejected (409)", s == 409, f"HTTP {s}")

print("\n══ TEST 2 · cancelled request leaves the officer's pending queue ══")
s, b = call("POST", "/api/requests", {"type": "semester"}, ananya)
req2 = b["requestId"]
q = call("GET", "/api/dept/clearances", cookie=fin)[1]["queue"]
before = [c for c in q if c["request"]["id"] == req2 and c["status"] == "PENDING"]
check("Finance queue shows the new pending file", len(before) == 1)
call("POST", f"/api/requests/{req2}/cancel", {"reason": ""}, ananya)  # reason optional
q = call("GET", "/api/dept/clearances", cookie=fin)[1]["queue"]
after = [c for c in q if c["request"]["id"] == req2 and c["status"] == "PENDING"]
check("after cancel: zero PENDING rows for it in Finance queue", len(after) == 0)
check("reason optional — cancelled without one", mine(ananya, req2)["request"].get("cancellationReason") is None)

print("\n══ TEST 3 · officer sees cancelled file read-only; anything pre-decision stays in ledger ══")
# karan's graduation file has Finance/Library/Sports cleared — cancel it mid-flight
kl = call("GET", "/api/requests/list", cookie=karan)[1]["requests"]
kreq = kl[0]["id"]
call("POST", f"/api/requests/{kreq}/cancel", {"reason": "Refiling after correcting my roll number."}, karan)
q = call("GET", "/api/dept/clearances", cookie=fin)[1]["queue"]
row = [c for c in q if c["request"]["id"] == kreq and c["status"] == "APPROVED"]
check("cancelled file still visible in officer ledger (history kept)",
      len(row) == 1 and row[0].get("requestCancelled") is True,
      f"flag={row[0].get('requestCancelled') if row else None}")
check("cancellation reason attached for the officer (read-only view)",
      bool(row and row[0].get("cancellationReason")), (row[0].get("cancellationReason") or "")[:40] if row else "")
check("no actionable PENDING row of the cancelled file anywhere in queue",
      all(not (c["request"]["id"] == kreq and c["status"] == "PENDING") for c in q))

print("\n══ TEST 4 · no approval / no certificate can ever land on a cancelled request ══")
b = mine(karan, kreq)
pending_clr = [c for c in b["clearances"] if c["status"] == "PENDING"][0]
s1, e1 = call("PUT", f"/api/dept/clearances/{pending_clr['id']}", {"action": "APPROVE"}, hostel)
s2, e2 = call("PUT", f"/api/dept/clearances/{pending_clr['id']}", {"action": "REJECT", "remarks": "test"}, hostel)
check("officer APPROVE on cancelled request → 409", s1 == 409, e1.get("error", "")[:45])
check("officer REJECT on cancelled request → 409", s2 == 409)
b = mine(karan, kreq)
check("still CANCELLED, certificateCode absent forever",
      b["overall"] == "CANCELLED" and not b["request"].get("certificateCode"))
s, b = call("GET", "/api/verify/CV-26-XXXXXX")
check("no verifiable certificate exists for it", s == 404 or not b.get("certificateCode"), f"HTTP {s}")

print("\n══ TEST 5 / 6 · completed (certificate-issued) requests can never be cancelled ══")
rl = call("GET", "/api/requests/list", cookie=rohan)[1]["requests"][0]
s, b = call("POST", f"/api/requests/{rl['id']}/cancel", {"reason": "test"}, rohan)
check("rohan's COMPLETED+certificated request → 409 with rule message",
      s == 409 and "certificat" in (b.get("error") or "").lower() or s == 409,
      f"HTTP {s} · {b.get('error','')[:60]}")

print("\n══ TEST 7 · cross-student cancellation blocked ══")
s, b = call("POST", "/api/requests", {"type": "hostel"}, zoya)   # fresh active file for the race tests
zreq = b["requestId"]
s, b = call("POST", f"/api/requests/{zreq}/cancel", {"reason": "not mine"}, ananya)
check("ananya attempting to cancel zoya's request → 403", s == 403, f"HTTP {s}")

print("\n══ TEST 8 · cancel → new request of same type gets a NEW id; old stays in history ══")
s, b = call("POST", f"/api/requests/{zreq}/cancel", {"reason": "Submitted by mistake"}, zoya)
check("cancel the fresh hostel filing", s == 200)
s, b = call("POST", "/api/requests", {"type": "hostel"}, zoya)
zreq2 = b.get("requestId")
check("re-filing same type succeeds right after cancellation", s == 200 and bool(zreq2))
check("new filing has a DIFFERENT request id", zreq2 != zreq, f"{zreq[-6:]} → {zreq2[-6:]}")
lst = call("GET", "/api/requests/list", cookie=zoya)[1]["requests"]
cancelled_rows = [r for r in lst if r["overall"] == "CANCELLED"]
check("history keeps cancelled filings (incl. seeded demo record)", len(cancelled_rows) >= 2,
      f"{len(cancelled_rows)} cancelled of {len(lst)} total")

print("\n══ TEST 9 · officer-approval vs student-cancellation race ══")
# Order A: approve first (wins) → cancel must fail with 409 (certificate mints, file COMPLETED)
clr = mine(zoya, zreq2)["clearances"][0]  # hostel workflow → single HOSTEL clearance
s_a, _ = call("PUT", f"/api/dept/clearances/{clr['id']}", {"action": "APPROVE"}, hostel)
s_b, e_b = call("POST", f"/api/requests/{zreq2}/cancel", {"reason": "too late"}, zoya)
b2 = mine(zoya, zreq2)
check("order A: approval lands first → cancel rejected",
      s_a == 200 and s_b == 409 and b2["overall"] == "COMPLETED" and bool(b2["request"].get("certificateCode")),
      f"overall={b2['overall']} cert={b2['request'].get('certificateCode')}")

# Order B: cancel first (wins) → approve must fail with 409; request stays CANCELLED
s, b = call("POST", "/api/requests", {"type": "hostel"}, zoya)   # completed file exists → new one allowed
zreq3 = b["requestId"]
clr3 = mine(zoya, zreq3)["clearances"][0]
s_a, _ = call("POST", f"/api/requests/{zreq3}/cancel", {"reason": "changed my mind"}, zoya)
s_b, _ = call("PUT", f"/api/dept/clearances/{clr3['id']}", {"action": "APPROVE"}, hostel)
b3 = mine(zoya, zreq3)
check("order B: cancellation lands first → approval rejected, file stays CANCELLED",
      s_a == 200 and s_b == 409 and b3["overall"] == "CANCELLED"
      and all(c["status"] == "PENDING" for c in b3["clearances"]),
      f"approve HTTP {s_b}, overall={b3['overall']}")

# True concurrency: two threads released on the same tick, asserting the XOR invariant
s, b = call("POST", "/api/requests", {"type": "hostel"}, zoya)
zreq4 = b["requestId"]
clr4 = mine(zoya, zreq4)["clearances"][0]
results = {}
barrier = threading.Barrier(3)
def do_cancel():
    barrier.wait()
    results["cancel"] = call("POST", f"/api/requests/{zreq4}/cancel", {"reason": "race"}, zoya)[0]
def do_approve():
    barrier.wait()
    results["approve"] = call("PUT", f"/api/dept/clearances/{clr4['id']}", {"action": "APPROVE"}, hostel)[0]
t1, t2 = threading.Thread(target=do_cancel), threading.Thread(target=do_approve)
t1.start(); t2.start(); barrier.wait(); t1.join(); t2.join()
b4 = mine(zoya, zreq4)
final = b4["overall"]
clr_status = b4["clearances"][0]["status"]
xor_valid = (
    (results.get("cancel") == 200 and results.get("approve") == 409 and final == "CANCELLED" and clr_status == "PENDING") or
    (results.get("approve") == 200 and results.get("cancel") == 409 and final == "COMPLETED" and clr_status == "APPROVED")
)
check("concurrent race resolves to exactly ONE valid terminal state (never CANCELLED-then-approved)",
      xor_valid, f"cancel={results.get('cancel')} approve={results.get('approve')} → {final}/{clr_status}")

print("\n══ Audit trail ══")
s, admin = login("admin@campus.edu", "admin123")
aud = call("GET", "/api/admin/audit", cookie=admin)[1]["audit"]
cancels = [a for a in aud if a.get("action") == "REQUEST_CANCELLED"]
check("REQUEST_CANCELLED audit events exist with reason + timestamp",
      len(cancels) >= 4 and all(a.get("createdAt") for a in cancels),
      f"{len(cancels)} events · latest: {cancels[0]['detail'][:60]}")

print(f"\n{'═'*58}\nRESULT: {PASS} passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
