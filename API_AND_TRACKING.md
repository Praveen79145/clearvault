# ClearVault - Request Tracking Data Flow & API Contracts

## API Request Types Response

### GET `/api/request-types`

**Response (New Structure):**

```json
{
  "types": [
    {
      "id": "study-certificate",
      "title": "Study Certificate",
      "blurb": "Request an official certificate confirming your enrollment and academic standing.",
      "purpose": "Study Certificate",
      "icon": "award",
      "requires": [
        {
          "id": "ADMIN",
          "name": "Administrative Office",
          "short": "Admin",
          "officerTitle": "Administrative Officer",
          "icon": "stamp",
          "code": "ADM"
        }
      ]
    },
    {
      "id": "no-due-certificate",
      "title": "No-Due Certificate",
      "blurb": "Verify that you have no outstanding dues across Finance, Library, Hostel, and Sports.",
      "purpose": "No-Due Certificate",
      "icon": "check-circle",
      "requires": [
        {
          "id": "FINANCE",
          "name": "Finance Office",
          "short": "Finance",
          "officerTitle": "Finance Officer",
          "icon": "wallet",
          "code": "FIN"
        },
        {
          "id": "LIBRARY",
          "name": "Library",
          "short": "Library",
          "officerTitle": "Library Officer",
          "icon": "book-open",
          "code": "LIB"
        },
        {
          "id": "HOSTEL",
          "name": "Hostel",
          "short": "Hostel",
          "officerTitle": "Hostel Warden",
          "icon": "home",
          "code": "HOS"
        },
        {
          "id": "SPORTS",
          "name": "Sports",
          "short": "Sports",
          "officerTitle": "Sports Officer",
          "icon": "trophy",
          "code": "SPT"
        }
      ]
    },
    {
      "id": "no-objection-certificate",
      "title": "No Objection Certificate",
      "blurb": "Obtain clearance from all required departments for external commitments.",
      "purpose": "No Objection Certificate",
      "icon": "clipboard-check",
      "requires": [
        // Finance, Library, Hostel, Sports (same as no-due)
      ]
    },
    {
      "id": "tc-graduation",
      "title": "TC & Graduation Clearance",
      "blurb": "Apply for your PUC Transfer Certificate and Graduation Clearance from one place.",
      "purpose": "TC & Graduation Clearance",
      "icon": "book-open",
      "requires": [
        // All 9 departments: Finance, Library, Hostel, Sports,
        // Physics Lab, Chemistry Lab, Dean, AO, Director
      ]
    }
  ]
}
```

---

## Request Tracking Data

### GET `/api/requests/list`

**Response Structure:**

```json
{
  "requests": [
    {
      "id": "req-abc-123",
      "type": "no-due-certificate",
      "purpose": "No-Due Certificate",
      "createdAt": "2026-08-23T10:30:00Z",
      "completedAt": null,
      "certificateCode": null,
      "cancelledAt": null,
      "cancelledBy": null,
      "cancellationReason": null,
      "overall": "IN_PROGRESS",
      "total": 5,
      "cleared": 3
    },
    {
      "id": "req-def-456",
      "type": "study-certificate",
      "purpose": "Study Certificate",
      "createdAt": "2026-08-20T14:15:00Z",
      "completedAt": "2026-08-20T16:45:00Z",
      "certificateCode": "CV-26-F4A7B2",
      "cancelledAt": null,
      "cancelledBy": null,
      "cancellationReason": null,
      "overall": "COMPLETED",
      "total": 1,
      "cleared": 1
    },
    {
      "id": "req-ghi-789",
      "type": "tc-graduation",
      "purpose": "TC / Migration Clearance",
      "createdAt": "2026-08-15T09:00:00Z",
      "completedAt": null,
      "certificateCode": null,
      "cancelledAt": null,
      "cancelledBy": null,
      "cancellationReason": null,
      "overall": "ACTION_REQUIRED",
      "total": 9,
      "cleared": 4
    }
  ]
}
```

**Status Values:**
- `"overall"`: `"IN_PROGRESS"`, `"ACTION_REQUIRED"`, `"COMPLETED"`, `"CANCELLED"`
- `"type"`: Request type ID from REQUEST_TYPES registry
- `"total"`: Count of required departments for this type
- `"cleared"`: Count of APPROVED clearances so far

---

### GET `/api/requests/{id}`

**Response Structure:**

```json
{
  "request": {
    "id": "req-abc-123",
    "studentId": "student-001",
    "purpose": "No-Due Certificate",
    "createdAt": "2026-08-23T10:30:00Z",
    "completedAt": null,
    "certificateCode": null,
    "cancelledAt": null,
    "cancelledBy": null,
    "cancellationReason": null
  },
  "overall": "IN_PROGRESS",
  "clearances": [
    {
      "id": "clr-001",
      "requestId": "req-abc-123",
      "dept": "FINANCE",
      "deptName": "Finance Office",
      "officerTitle": "Finance Officer",
      "deptIcon": "wallet",
      "status": "APPROVED",
      "remarks": "No dues found.",
      "approvedBy": "Rajesh Kumar",
      "signedAt": "2026-08-23T11:00:00Z",
      "signatureHash": "SIGN abcd1234"
    },
    {
      "id": "clr-002",
      "requestId": "req-abc-123",
      "dept": "LIBRARY",
      "deptName": "Library",
      "officerTitle": "Library Officer",
      "deptIcon": "book-open",
      "status": "APPROVED",
      "remarks": "Books returned & fines cleared.",
      "approvedBy": "Priya Sharma",
      "signedAt": "2026-08-24T10:30:00Z",
      "signatureHash": "SIGN efgh5678"
    },
    {
      "id": "clr-003",
      "requestId": "req-abc-123",
      "dept": "HOSTEL",
      "deptName": "Hostel",
      "officerTitle": "Hostel Warden",
      "deptIcon": "home",
      "status": "PENDING",
      "remarks": null,
      "approvedBy": null,
      "signedAt": null,
      "signatureHash": null
    },
    {
      "id": "clr-004",
      "requestId": "req-abc-123",
      "dept": "SPORTS",
      "deptName": "Sports",
      "officerTitle": "Sports Officer",
      "deptIcon": "trophy",
      "status": "PENDING",
      "remarks": null,
      "approvedBy": null,
      "signedAt": null,
      "signatureHash": null
    }
  ]
}
```

**Clearance Status Values:**
- `"PENDING"` - Department hasn't reviewed yet
- `"APPROVED"` - Department cleared, no dues found
- `"REJECTED"` - Department found dues or issues, student must resolve

**Status Progression:**
```
PENDING → APPROVED (cleared)
PENDING → REJECTED (dues found or issues)
REJECTED → PENDING (student re-applies after resolving dues)
```

---

## Department Tracker Component Integration

### Component Props

```jsx
<DepartmentTracker 
  clearances={clearancesArray}
  compact={false}  // or true for inline mode
/>
```

### Compact Mode (Request List)

**Input:**
```jsx
clearances: [
  { status: "APPROVED", ... },
  { status: "APPROVED", ... },
  { status: "PENDING", ... },
  { status: "PENDING", ... }
]
compact={true}
```

**Output:** Inline circular indicators
```
[✓][✓][●][●]
```

### Detailed Mode (Request View)

**Input:**
```jsx
clearances: [
  {
    id: "clr-001",
    deptName: "Finance",
    officerTitle: "Finance Officer",
    status: "APPROVED",
    remarks: "No dues found.",
    approvedBy: "Officer Name",
    signedAt: "2026-08-23T11:00:00Z"
  },
  // ... more clearances
]
compact={false}
```

**Output:** Full vertical tracker with workflow lines and detailed information

---

## Real-Time Updates via Polling

### Frontend Polling Pattern

```javascript
// RequestView.jsx / CombinedTCGraduation.jsx
const poll = useRef(false);

useEffect(() => {
  if (!poll.current) {
    poll.current = true;
    
    // Poll every 5-8 seconds (RequestView: 5s, Student: 8s)
    const t = setInterval(() => {
      load().catch(() => {}); // Load latest data
    }, 5000);
    
    return () => clearInterval(t);
  }
}, []);
```

### When Authority Updates Status

```
1. Officer clicks "Approve" or "Reject" in Staff dashboard
   ↓
2. Backend updates clearance status in database
   ↓
3. Sends notification to student (optional)
   ↓
4. Next poll cycle (every 5-8 seconds):
   Student's frontend calls GET /api/requests/{id}
   ↓
5. API returns updated clearances array
   ↓
6. Component re-renders with new status
   ↓
7. DepartmentTracker displays updated visual:
      ✓ Finance (was PENDING, now APPROVED)
      ● Hostel (still PENDING)
      ○ Sports (not yet reviewed)
```

---

## Status Display Rules

### Based on Clearance Status

| Status | Icon | Color | Label | Description |
|--------|------|-------|-------|-------------|
| APPROVED | ✓ | Muted Green | "Approved" / "Cleared" | Department cleared the request, no dues |
| REJECTED | ✗ | Muted Red | "Rejected" / "Due / Action Required" | Department found dues, student must resolve |
| PENDING | ● | Muted Amber | "Pending" / "Under Review" | Awaiting department decision |
| NOT_REVIEWED | ○ | Muted Gray | "Not Yet Reviewed" | Department hasn't started review |

### For TC & Graduation Combined Card

When student clicks "TC & Graduation Clearance":

```
CombinedTCGraduation Page loads

│
├─ PUC Transfer Certificate Section
│  ├─ Check if `requests.find(r => r.purpose === "TC / Migration Clearance")`
│  ├─ If exists: Show "Continue Request" button + current status
│  └─ If not exists: Show "Start Request" button
│
└─ Graduation Clearance Section
   ├─ Check if `requests.find(r => r.purpose === "Final Year / Graduation Clearance")`
   ├─ If exists: Show "Continue Request" button + current status
   └─ If not exists: Show "Start Request" button
```

Each starts its own request via:
```
POST /api/requests
{ "type": "tc" }  // or "graduation"
```

Backend internally creates clearance records for all 9 departments for that specific type.

---

## Data-Driven Architecture

### No Frontend Hardcoding

All source of truth in backend:

```javascript
// backend/src/requestTypes.js
REQUEST_TYPES = [
  {
    id: "...",
    title: "...",
    requires: ["DEPT1", "DEPT2", ...], // ← This drives everything
  }
]

// backend/src/departments.js
DEPTS = [
  {
    id: "FINANCE",
    name: "Finance Office",
    officerTitle: "Finance Officer",
    // ... more metadata
  }
]
```

### Frontend Flow

```
1. Load GET /api/request-types
2. Display cards based on REQUEST_TYPES array
3. When request is fetched, GET /api/requests/{id}
4. API returns clearances array with departments
5. Length of clearances[] matches REQUEST_TYPES[...].requires length
6. DepartmentTracker iterates over clearances array
7. All department names, icons, order come from API
8. No hardcoded department lists on frontend
```

### If Backend Config Changes

```
Change: backend/src/requestTypes.js
  REQUEST_TYPES.find(t => t.id === "no-due-certificate").requires
    = ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS", "DEAN"]

Result:
  1. API returns 5 departments instead of 4
  2. DepartmentTracker automatically renders 5 steps
  3. Frontend never needed to change
  4. No migration, no app rebuild needed
```

---

## Error Handling & Edge Cases

### Cancelled Request

```
If request.cancelledAt != null:
  - overall = "CANCELLED"
  - DepartmentTracker renders with opacity-60
  - Status labels show "Frozen at cancellation"
  - Pending clearances show "Never decided — cancelled before review"
  - All action buttons disabled
```

### Request With All Approvals Cleared

```
If all required departments status = "APPROVED":
  - overall = "COMPLETED"
  - certificateCode populated
  - Show certificate CTA banner
  - Display certificate code (CV-26-XXXXX)
  - Link to /certificate/{id} for download
```

### Mixed Status (Some Approved, Some Pending, Some Rejected)

```
If any clearance.status = "REJECTED":
  - overall = "ACTION_REQUIRED"
  - Show rejection banner with details
  - Highlight REJECTED department in tracker
  - Show "Re-apply" button next to rejected department
  - Student must resolve dues and click re-apply
  - Next GET /api/requests/{id} will show new PENDING status
```

### Timeout/Offline Handling

```
If polling fails (network error):
  - setLoadErr set in catch block
  - Display error banner
  - Continue polling in background
  - Auto-recover when network returns
  - User sees eventually consistent state
```

---

## Testing Scenarios

### Scenario 1: Fresh Request Flow

```
1. Student clicks "No-Due Certificate"
2. POST /api/requests { type: "no-due-certificate" }
3. Backend creates request + 4 clearances (all PENDING)
4. Frontend redirects to /student/request/no-due-certificate
5. GET /api/requests/{id} returns:
   - request.overall = "IN_PROGRESS"
   - clearances with 4 PENDING items
6. DepartmentTracker renders 4 pending circles
7. Each shows "Awaiting review"
```

### Scenario 2: Department Approval Mid-Polling

```
1. Student viewing request (tracker shows 2 APPROVED, 2 PENDING)
2. Officer in Staff panel approves Finance
3. Officer approves Library
4. Next poll cycle (5s):
   GET /api/requests/{id}
5. clearances array now shows Finance and Library as APPROVED
6. DepartmentTracker re-renders
7. User sees ✓ Finance, ✓ Library, ● Hostel, ● Sports
8. Smooth visual update without refresh
```

### Scenario 3: Dues Found (Rejection)

```
1. Officer reviews and finds dues
2. Officer rejects with message: "₹500 tuition fees pending"
3. Backend sets clearance.status = "REJECTED"
4. Next poll: GET /api/requests/{id}
5. overall = "ACTION_REQUIRED"
6. DepartmentTracker shows:
   ✗ Finance [REJECTED]
   With officer comment displayed
   "Re-apply" button shown
7. Student pays dues, clicks "Re-apply"
8. POST /api/clearances/{id}/reapply
9. Backend resets status to PENDING
10. Next poll shows ● Finance [PENDING] again
```

### Scenario 4: All Approvals Cleared

```
1. All 5 departments approve one by one
2. After 5th approval:
   - Backend calculates all required APPROVED
   - Backend sets request.completedAt
   - Backend generates request.certificateCode = "CV-26-XXXXX"
3. Next poll:
   - overall = "COMPLETED"
   - certificateCode visible
4. Frontend:
   - Hides "Request" sections
   - Shows green certificate banner
   - Certificate CTA button active
   - Link to /certificate/{id} works
```

---

## Summary

**Key Principles:**
- ✓ All configuration driven by backend (REQUEST_TYPES, DEPTS)
- ✓ Real-time updates via polling (5-8 second cycles)
- ✓ Status reflects actual authority actions immediately
- ✓ No hardcoded department lists or workflows
- ✓ Visual tracking responsive to API data
- ✓ Professional, university-appropriate styling
- ✓ Backward compatible with legacy data
- ✓ Clear status indicators for all states
