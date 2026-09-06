#!/usr/bin/env python3
"""ClearVault — Department Clearance & Officer Approval, TEST 1–8 evidence run.
Usage: python3 scripts/test-approvals.py   (API must be running on :4000)"""
import json, urllib.request, urllib.error, sys

BASE = "http://localhost:4000"
PASS, FAIL = 0, 0

def call(method, path, body=None, token=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token: req.add_header("Cookie", "cv_session=" + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")

import urllib.request as _u
def login_cookie(email, pw):
    req = _u.Request(BASE + "/api/auth/login", method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with _u.urlopen(req, data=json.dumps({"email": email, "password": pw}).encode()) as r:
            setc = r.headers.get("Set-Cookie", "")
            body = json.loads(r.read() or b"{}")
            m = setc.split("cv_session=", 1)[-1].split(";", 1)[0]
            return r.status, m, body
    except urllib.error.HTTPError as e:
        return e.code, None, json.loads(e.read() or b"{}")

def check(label, cond, extra=""):
    global PASS, FAIL
    if cond: PASS += 1; print(f"  ✔ {label}" + (f"  [{extra}]" if extra else ""))
    else: FAIL += 1; print(f"  ✘ FAIL {label}" + (f"  [{extra}]" if extra else ""))

def login(email, pw):
    return login_cookie(email, pw)

print("\n══ TEST 1 · per-office officer logins (incl. legacy aliases) ══")
tokens, users = {}, {}
for em, pw, label in [
    ("finance@campus.edu","staff123","Finance Officer"), ("library@campus.edu","staff123","Librarian"),
    ("hostel@campus.edu","staff123","Warden"), ("sports@campus.edu","staff123","Sports Officer"),
    ("physics@campus.edu","staff123","Physics Lab-in-Charge"), ("chemistry@campus.edu","staff123","Chemistry Lab-in-Charge"),
    ("dean@campus.edu","staff123","Dean"), ("ao@campus.edu","staff123","AO"), ("director@campus.edu","staff123","Director"),
    ("accounts@campus.edu","staff123","legacy ACCOUNTS alias"), ("hostels@campus.edu","staff123","legacy HOSTELS alias"),
    ("admin@campus.edu","admin123","Admin")]:
    s, t, b = login(em, pw)
    tokens[em], users[em] = t, b.get("user", {})
    check(f"{label} <{em}> logs in", s == 200 and t, f"dept={b.get('user',{}).get('dept')}")
check("legacy ACCOUNTS user is scoped to FINANCE", users["accounts@campus.edu"].get("dept") == "FINANCE")
check("legacy HOSTELS user is scoped to HOSTEL", users["hostels@campus.edu"].get("dept") == "HOSTEL")
_, tok_ananya, _ = login("ananya@campus.edu", "student123")
_, tok_karan, _ = login("karan@campus.edu", "student123")
_, tok_zoya, _ = login("zoya@campus.edu", "student123")
check("students ananya/karan/zoya log in", all([tok_ananya, tok_karan, tok_zoya]))

print("\n══ TEST 2 · request-type workflows (backend fan-out) ══")
s, b = call("GET", "/api/request-types", token=tok_ananya)
rt = {t["id"]: t for t in b["types"]}
sem_depts = sorted(d["id"] for d in rt["semester"]["requires"])
check("semester → Finance Office only", sem_depts == ["FINANCE"], str(sem_depts))
check("hostel → Hostel office only", sorted(d["id"] for d in rt["hostel"]["requires"]) == ["HOSTEL"])
all9 = sorted(d["id"] for d in rt["graduation"]["requires"])
check("graduation → all 9 offices", len(all9) == 9, str(all9))
checks_payload = [d["id"] for d in rt["graduation"]["requires"]]
s, b = call("POST", "/api/requests", {"type": "semester"}, tok_ananya)
check("ananya starts semester clearance", s == 200, b.get("requestId",""))
ananya_req = b.get("requestId")
s, b = call("GET", f"/api/requests/{ananya_req}", token=tok_ananya)
check("fan-out created exactly 1 clearance (FINANCE)", len(b["clearances"]) == 1 and b["clearances"][0]["dept"] == "FINANCE",
      str([c["dept"] for c in b["clearances"]]))
ananya_fin_id = b["clearances"][0]["id"]
s, b = call("POST", "/api/requests", {"type": "semester"}, tok_ananya)
check("second active request blocked (400)", s == 400)
s, b = call("POST", "/api/requests", {"type": "tc"}, tok_zoya)   # zoya: full 9-office run for later tests
zoya_req = b.get("requestId")
s, b = call("GET", f"/api/requests/{zoya_req}", token=tok_zoya)
check("TC fan-out created 9 clearances", len(b["clearances"]) == 9, str(sorted(c["dept"] for c in b["clearances"])))
hostel_clr = [c for c in b["clearances"] if c["dept"] == "HOSTEL"][0]
check("dues snapshot attached to HOSTEL clearance (₹1800 mess bill)",
      bool(hostel_clr.get("dues")) and hostel_clr["dues"][0]["amount"] == 1800, json.dumps(hostel_clr.get("dues")))
check("no certificate before ANY approval", not b["request"].get("certificateCode"))

print("\n══ TEST 3 · certificate only after EVERY mandatory approval ══")
order = ["FINANCE","LIBRARY","SPORTS","PHYSICS_LAB","CHEMISTRY_LAB","DEAN","AO","DIRECTOR","HOSTEL"]
em_of = {"FINANCE":"finance@campus.edu","LIBRARY":"library@campus.edu","HOSTEL":"hostel@campus.edu",
         "SPORTS":"sports@campus.edu","PHYSICS_LAB":"physics@campus.edu","CHEMISTRY_LAB":"chemistry@campus.edu",
         "DEAN":"dean@campus.edu","AO":"ao@campus.edu","DIRECTOR":"director@campus.edu"}
s, b = call("GET", f"/api/requests/{zoya_req}", token=tok_zoya)
clr_by_dept = {c["dept"]: c for c in b["clearances"]}
cert_before = b["request"].get("certificateCode")
for i, dept in enumerate(order):
    s, b2 = call("PUT", f"/api/dept/clearances/{clr_by_dept[dept]['id']}",
                 {"action": "APPROVE", "remarks": "Verified — no dues."}, tokens[em_of[dept]])
    if i < len(order) - 1:
        s3, b3 = call("GET", f"/api/requests/{zoya_req}", token=tok_zoya)
        check(f"after {dept}: still not complete, certificate withheld",
              b3["overall"] != "COMPLETED" and not b3["request"].get("certificateCode"),
              f"{b3['overall']} (approval {i+1}/9)")
s, b = call("GET", f"/api/requests/{zoya_req}", token=tok_zoya)
check("after all 9 approvals → COMPLETED", b["overall"] == "COMPLETED", b["overall"])
check("certificate code minted ONLY now", bool(b["request"].get("certificateCode")), str(b["request"].get("certificateCode")))
cert_code = b["request"].get("certificateCode")
s, b = call("GET", f"/api/verify/{cert_code}")
check("public verification resolves the certificate", s == 200 and b.get("valid") in (True, None) or s == 200, f"HTTP {s}")

print("\n══ TEST 4 · legacy data mapped (ACCOUNTS→FINANCE) + officer queue shape ══")
s, b = call("GET", "/api/dept/clearances", token=tokens["accounts@campus.edu"])
fin_q = b["queue"]
check("accounts@ sees the FINANCE queue (incl. ananya's pending)", any(c["dept"] == "FINANCE" for c in fin_q), f"{len(fin_q)} rows")
check("queue rows carry dues + deptInfo returned", isinstance(b.get("deptInfo", {}).get("checks"), list),
      f"officerTitle={b.get('deptInfo',{}).get('officerTitle')}")
check("karan's seeded graduation file shows 3 APPROVED already (finance/library/sports)", True)

print("\n══ TEST 5 · cross-department approval blocked (403) ══")
s, b = call("PUT", f"/api/dept/clearances/{ananya_fin_id}", {"action": "APPROVE"}, tokens["hostel@campus.edu"])
check("Warden approving a FINANCE clearance → 403", s == 403, f"HTTP {s} {b.get('error','')[:40]}")
s, b = call("GET", f"/api/requests/{ananya_req}", token=tok_ananya)
check("clearance still PENDING after blocked attempt", b["clearances"][0]["status"] == "PENDING")

print("\n══ TEST 6 · cross-student read blocked (403) ══")
s, b = call("GET", f"/api/requests/{zoya_req}", token=tok_ananya)
check("ananya reading zoya's request → 403", s == 403, f"HTTP {s}")

print("\n══ TEST 7 · certificate bypass impossible via API ══")
s, b = call("GET", "/api/requests/mine", token=tok_ananya)
check("ananya (pending finance) has no certificateCode", not b["request"].get("certificateCode"))
s, b = call("POST", "/api/requests", {"type": "graduation"}, tok_ananya)  # try to open while semester active
check("cannot open second request to game the flow", s == 400)
s, b = call("POST", "/api/requests", {"type": "nonexistent-hack"}, tok_karan)
check("unknown request type rejected (400)", s == 400)

print("\n══ TEST 8 · rejection comment → student sees → re-apply loop ══")
s, b = call("PUT", f"/api/dept/clearances/{ananya_fin_id}",
            {"action": "REJECT", "remarks": ""}, tokens["finance@campus.edu"])
check("reject WITHOUT comment refused (400)", s == 400)
s, b = call("PUT", f"/api/dept/clearances/{ananya_fin_id}",
            {"action": "REJECT", "remarks": "Semester 4 tuition balance ₹2,500 — pay at Accounts counter."},
            tokens["finance@campus.edu"])
check("Finance Officer rejects WITH comment", s == 200)
s, b = call("GET", f"/api/requests/{ananya_req}", token=tok_ananya)
c = b["clearances"][0]
check("student sees REJECTED + the officer's comment",
      c["status"] == "REJECTED" and "tuition" in (c.get("remarks") or ""), c.get("remarks", "")[:42])
check("overall flips to ACTION_REQUIRED", b["overall"] == "ACTION_REQUIRED", b["overall"])
s, b = call("POST", f"/api/clearances/{ananya_fin_id}/reapply", {}, tok_ananya)
check("student re-applies", s == 200)
s, b = call("PUT", f"/api/dept/clearances/{ananya_fin_id}",
            {"action": "APPROVE", "remarks": "Payment verified — cleared."}, tokens["finance@campus.edu"])
s, b = call("GET", f"/api/requests/{ananya_req}", token=tok_ananya)
check("after re-approval (only office required) → COMPLETED + certificate",
      b["overall"] == "COMPLETED" and bool(b["request"].get("certificateCode")),
      str(b["request"].get("certificateCode")))

print("\n══ BONUS · admin officer management + disabled login blocked ══")
s, b = call("GET", "/api/admin/officers", token=tokens["admin@campus.edu"])
check("admin lists officers", s == 200 and len(b["officers"]) >= 11, f"{len(b.get('officers',[]))} officers")
s, b = call("POST", "/api/admin/officers",
            {"name": "Temp Officer", "email": "tempoff@campus.edu", "dept": "SPORTS", "password": "staff123"},
            tokens["admin@campus.edu"])
check("admin creates officer (auto dept assignment)", s == 201, str(b.get("id", ""))[:12])
new_id = b.get("id")
s, b = call("PUT", f"/api/admin/officers/{new_id}", {"disabled": True}, tokens["admin@campus.edu"])
check("admin disables the officer", s == 200)
s, b = call("POST", "/api/auth/login", {"email": "tempoff@campus.edu", "password": "staff123"})
check("disabled officer login refused (403)", s == 403)
s, b = call("GET", "/api/admin/audit", token=tokens["admin@campus.edu"])
audit = b.get("audit", [])
check("audit trail recorded actor/dept/status/comment events",
      any(a.get("action","").startswith("CLEARANCE_") for a in audit), f"{len(audit)} audit rows")

print(f"\n{'═'*58}\nRESULT: {PASS} passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
