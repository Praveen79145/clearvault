# ClearVault Student Portal - Visual Architecture

## Request System Overview

### Student Dashboard (Student.jsx)

```
┌─────────────────────────────────────────────────────────────┐
│  Student Services                                           │
│  Choose a request                                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │  │                  │
│  Study           │  │  No-Due          │  │  No Objection    │
│  Certificate     │  │  Certificate     │  │  Certificate     │
│                  │  │                  │  │                  │
│  ADMIN [1]       │  │  F→L→H→S [4]    │  │  F→L→H→S [4]    │
│                  │  │                  │  │                  │
│  Start Request   │  │  Start Request   │  │  Start Request   │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TC & Graduation Clearance                                  │
│  Apply for PUC Transfer Certificate & Graduation Clearance  │
│  All 9 Offices [9]                                          │
│  Continue Request                                           │
└─────────────────────────────────────────────────────────────┘


Your Requests
┌──────────────────────────────────────────────────────────────┐
│ No-Due Certificate #REQ-00123                                │
│ Filed 23 Aug 2026                                           │
│ Progress: 3/5 offices cleared (60%)                         │
│                                                              │
│ View full tracking →                                        │
│                           [In Progress]                     │
├──────────────────────────────────────────────────────────────┤
│ Study Certificate #REQ-00120                                │
│ Filed 20 Aug 2026                                           │
│ Progress: 1/1 office cleared (100%)                         │
│                                                              │
│ View full tracking →                                        │
│                           [Certificate Ready]              │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Detail Page (RequestView.jsx / TC&Graduation)

### For Combined TC & Graduation (CombinedTCGraduation.jsx)

```
┌─────────────────────────────────────────────────────────────┐
│ ← All request types                                         │
│                                                              │
│ 📖 Combined Service                                         │
│                                                              │
│ TC & Graduation Clearance                                   │
│ You can apply for PUC Transfer Certificate and Graduation   │
│ Clearance independently. Each is handled as a separate      │
│ request with its own tracking.                              │
└─────────────────────────────────────────────────────────────┘


SERVICE 1 OF 2
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ 📄 PUC Transfer Certificate                                 │
│                                                              │
│ Migration to another institution — full institutional      │
│ clearance from all nine offices.                           │
│                                                              │
│ Required Information:                                        │
│ ✓ Institution details                                       │
│ ✓ Course information                                        │
│ ✓ Academic records                                          │
│ ✓ Institutional approval                                    │
│                                                              │
│ [Start Request]                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘


SERVICE 2 OF 2
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ 🎓 Graduation Clearance                                     │
│                                                              │
│ Final-year clearance — every office signs off before       │
│ certificate issuance.                                       │
│                                                              │
│ Required Information:                                        │
│ ✓ Degree verification                                       │
│ ✓ Academic records                                          │
│ ✓ Department certifications                                 │
│ ✓ Final institutional approval                             │
│                                                              │
│ [Start Request]                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### For Single Request (RequestView.jsx)

```
┌─────────────────────────────────────────────────────────────┐
│ ← All request types                                         │
│                                                              │
│ Request #REQ-A7C9 · 23 August 2026                         │
│ No-Due Certificate              [In Progress]              │
└─────────────────────────────────────────────────────────────┘

PROGRESS
┌─────────────────────────────────────────────────────────────┐
│ 3 of 5 mandatory approvals cleared | updates automatically │
│                                                              │
│ [████████████░░░░░░░░░░░░░] 60% complete                   │
└─────────────────────────────────────────────────────────────┘


DEPARTMENT APPROVAL WORKFLOW
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ ✓ Finance                    [APPROVED]                     │
│   Finance Officer                                           │
│   Cleared by Rajesh Kumar · 23 August 2026                 │
│   "No dues found."                                          │
│                                                              │
│   │                                                          │
│   ▼                                                          │
│                                                              │
│ ✓ Library                    [APPROVED]                     │
│   Library Officer                                           │
│   Cleared by Priya Sharma · 24 August 2026                 │
│   "Books returned & fines cleared."                        │
│                                                              │
│   │                                                          │
│   ▼                                                          │
│                                                              │
│ ● Hostel                     [PENDING]                      │
│   Hostel Warden                                             │
│   Under review                                              │
│                                                              │
│   │                                                          │
│   ▼                                                          │
│                                                              │
│ ○ Sports                     [PENDING]                      │
│   Sports Officer                                            │
│   Not yet reviewed                                          │
│                                                              │
│   │                                                          │
│   ▼                                                          │
│                                                              │
│ ○ Certificate                [PENDING]                      │
│   System Generated                                          │
│   Awaiting all approvals                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘


DETAILED DEPARTMENT RECORDS
┌─────────────────────────────────────────────────────────────┐
│ [Similar to current ledger, kept for detailed reference]   │
│ Shows officer signatures, dates, remarks for each dept     │
└─────────────────────────────────────────────────────────────┘
```

---

## Status Flow Diagram

```
                    ┌──────────────┐
                    │ START        │
                    │ (Submitted)  │
                    └──────┬───────┘
                           │
                    ┌──────▼────────┐
                    │ IN PROGRESS   │
         ┌──────────│ (Under Review)│◄──────────┐
         │          └──────┬────────┘           │
         │                 │                    │
         │         ┌───────▼────────┐           │
         │         │  Department:   │           │
         │         │  APPROVED ✓   │           │
         │         │  OR REJECTED ✗ │───┐       │
         │         └────────────────┘   │       │
         │                              │       │
         │                        ┌─────▼────────────┐
         │                        │ DUE FOUND / ACTION│
         │                        │ REQUIRED (Rejected)
         │                        └────┬─────────────┘
         │                             │
         │                    ┌────────▼────────┐
         │                    │ RE-VERIFICATION │
         │                    │ (Student fixes) │
         │                    └────┬────────────┘
         │                         │
         └─────────────────────────┘
                  (Reapply)
                                    
         All Departments APPROVED ✓
                    │
                    ▼
         ┌──────────────────────┐
         │ COMPLETED            │
         │ Certificate Issued   │
         │ CV-26-XXXX           │
         └──────────────────────┘
```

---

## Compact Tracker Mode (Request List)

```
┌────────────────────────────────────────────────────────────┐
│ No-Due Certificate #REQ-00123                              │
│                                                             │
│ Progress Display:                                          │
│ [✓][✓][●][○][○]                                           │
│  F  L  H  S  C                                            │
│                                                             │
│ 3 of 5 cleared                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Department Tracker Visual Elements

### Status Indicators

```
✓ (Checkmark) = APPROVED
  Green circle with white checkmark
  "Cleared"

● (Pulse Dot) = PENDING  
  Amber circle with animated pulse
  "Under Review"

✗ (X Mark) = REJECTED
  Red circle with white X
  "Rejected / Action Required"

○ (Empty) = NOT YET REVIEWED
  Light gray circle
  "Not yet reviewed"
```

### Connecting Lines

```
Vertical lines connect department circles to show workflow progression
Subtle gray color to not distract from content
Disappears in compact mode
```

### Information Display (Detailed Mode)

```
Department Name
Officer Title

Status Badge (color-coded)

For Approved:
- Officer Name who approved
- Date and time of approval
- Signature hash (cryptographic verification)
- Remarks/notes if any

For Rejected:
- Officer who rejected
- Clear reason/comment
- Officer name

For Pending:
- "Awaiting review" status
- Animated pulse indicator
```

---

## Color System (Professional & Accessible)

```
Status Colors:
  Approved    → Muted Green (#15803d) - Professional success indicator
  Pending     → Muted Amber (#b45309) - Neutral, waiting state
  Rejected    → Muted Red (#b42318)   - Clear alert without aggression
  Not Started → Muted Gray (#66716b)  - Secondary, inactive state

Background:
  Paper       → Warm Ivory (#f7f5ef)  - Primary background
  Surface     → Off-white (#fffefb)   - Card surfaces
  
Typography:
  Primary     → Deep Navy (#1b211d)   - Main text, excellent contrast
  Secondary   → Muted Gray (#66716b)  - Supporting text, subtle

Accents:
  Brand       → Teal (#0e6b4f)        - CTA buttons, interactive elements
  Line        → Light Tan (#e4dfd2)   - Borders, subtle divisions
```

---

## Responsive Breakpoints

```
Mobile (< 640px):
- Single column card layout
- Stacked tracker indicators
- Full-width sections
- Touch-friendly button sizing (min 44px)

Tablet (640px - 1024px):
- 2 column grid (sm:grid-cols-2)
- Horizontal compact tracker
- Readable typography

Desktop (> 1024px):
- 3 columns normal, 4th card wraps (lg:grid-cols-3 xl:grid-cols-4)
- Full horizontal department tracker
- Optimized spacing and typography
- No awkward single floating card
```

---

## Integration Points

### Data Flow

```
Student Dashboard (Student.jsx)
  ↓
  API: GET /api/request-types → [4 types]
  API: GET /api/requests/list → [requests with status]
  API: GET /api/student/dues   → [department dues]
  ↓
  Display 4 cards + request list with trackers
  ↓
  Click card → /student/request/{type}
  ↓
Request Detail (RequestView.jsx / CombinedTCGraduation.jsx)
  ↓
  If type = "tc-graduation" → Show Combined Page
  If type = "tc" or "graduation" → Handle as individual (legacy)
  ↓
  API: GET /api/requests/{id} → [request + clearances]
  ↓
  Display DepartmentTracker with live data
  ↓
  Real-time polling (8s intervals) → Update tracker
  ↓
  When authority acts → API updates status → Tracker refreshes
```

### Firebase Integration Points

```
✓ Existing API already returns correct department data
✓ Backend requestTypes.js drives the UI (no frontend hardcoding)
✓ Tracker updates via polling on real authority actions
✓ Status transitions happen in backend, reflected immediately
✓ No fake/hardcoded data in production paths
✓ All workflows configurable via departments.js and requestTypes.js
```

---

**Design Philosophy:** 
Clean, professional university e-governance portal styling. No AI-generated dashboard aesthetics. Registrar office documentation aesthetic with strong typography hierarchy, clear information architecture, and professional color restraint.
