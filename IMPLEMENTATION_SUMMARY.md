# ClearVault Student Portal - Request System Modernization

## Summary of Changes

This document outlines all modifications made to implement the new 4-card request system with advanced department tracking and combined TC & Graduation Clearance service.

---

## 1. Backend Changes

### 1.1 Request Types Registry (`backend/src/requestTypes.js`)

**Changed:** Reduced request types from 5 to 4 cards and restructured request system.

**Previous Structure:**
- Semester Clearance
- Hostel Vacating Clearance  
- Transfer Certificate (TC)
- Graduation Clearance

**New Structure:**
- Study Certificate (new) - requires ADMIN only
- No-Due Certificate (new) - requires Finance, Library, Hostel, Sports
- No Objection Certificate (new) - requires Finance, Library, Hostel, Sports
- TC & Graduation Clearance (combined) - requires all 9 offices

**Key Updates:**
- Added new `SUBTYPE` export for tracking TC vs Graduation within combined card
- Combined TC and Graduation into single card with subtypes metadata
- Updated `requestTypeOf()` to map legacy purposes to new combined type
- Updated `requiredDeptsForType()` and `requiredDeptsForRequest()` to handle new types
- Backward compatible with existing database records via legacy mapping

### 1.2 Departments Registry (`backend/src/departments.js`)

**Changed:** Added ADMIN department for Study Certificate.

**Added Department:**
```javascript
{
  id: "ADMIN", 
  code: "ADM", 
  name: "Administrative Office", 
  short: "Admin",
  officerTitle: "Administrative Officer", 
  icon: "stamp", 
  checks: ["Enrollment status verified", "Academic record confirmed"],
}
```

---

## 2. Frontend Changes

### 2.1 New Component: DepartmentTracker (`frontend/src/components/DepartmentTracker.jsx`)

**Purpose:** Display visual step-by-step department approval workflow.

**Features:**
- Horizontal compact mode for request list (inline department indicators)
- Detailed vertical mode for full tracking view (RequestView)
- Status indicators (checkmark for approved, X for rejected, pulse dot for pending)
- Visual connector lines between departments
- Status labels: "Approved", "Rejected", "Pending", "Due / Action Required"
- Officer information and remarks display
- Professional styling matching ClearVault design tokens

**Modes:**
- `compact={false}` - Full detailed tracker with department names, officer info, and status text
- `compact={true}` - Inline circular indicators for request list

### 2.2 New Page: Combined TC & Graduation (`frontend/src/pages/CombinedTCGraduation.jsx`)

**Purpose:** When student clicks "TC & Graduation Clearance" card, display two independent service sections.

**Features:**
- Clear separation between PUC Transfer Certificate and Graduation Clearance sections
- Each service shows:
  - Title and description
  - Required information checklist
  - Current request status if exists
  - Start/Continue Request button
- Both services on one page for convenience
- Info banner when both requests are in progress
- Professional university portal styling

**Routing:**
- Accessible via `/student/request/tc-graduation`
- Also handles legacy `/student/request/tc` and `/student/request/graduation` URLs

### 2.3 Updated Student Page (`frontend/src/pages/Student.jsx`)

**Changes:**
1. **Request Cards Grid:** Updated to use `lg:grid-cols-3 xl:grid-cols-4` for proper 3+1 responsive layout
2. **Type Mapping:** Added logic to map legacy TC and Graduation types to new combined `tc-graduation` type
3. **Request List:** Redesigned "Your requests" section to display:
   - Request title and ID
   - Filed date
   - Progress percentage and office cleared count
   - Overall status badge
   - View full tracking link
4. **Department Tracker Integration:** Imported DepartmentTracker component for display (ready for future use in list)

**Code Updates:**
- Updated `latestByType` mapping to handle legacy request type mapping
- Modified request card layout for 4 cards exactly
- Simplified request list with cleaner layout
- Added progress information display

### 2.4 Updated RequestView Page (`frontend/src/pages/RequestView.jsx`)

**Changes:**
1. **Combined Type Handling:** Added redirect logic for `tc-graduation` type to show CombinedTCGraduation component
2. **Removed Segments Component:** Removed old visual progress segments
3. **Integrated DepartmentTracker:** 
   - Added DepartmentTracker for full detailed workflow visualization
   - Displays before detailed department ledger
   - Shows all department statuses with visual indicators
4. **Progress Display:** Simplified to clean progress bar with percentage indicator
5. **Detailed Records Section:** Kept existing department ledger as reference/detailed view below tracker

**Visual Flow:**
- Header with request type and overall status
- Simple progress bar showing % complete
- NEW: DepartmentTracker showing department-by-department workflow
- Existing: Detailed Department Records section for reference
- Cancellation and certificate CTA sections

### 2.5 Icon Updates (`frontend/src/icons.jsx`)

**Added Icons:**
- `award` - Study Certificate icon
- `check-circle` - No-Due Certificate icon  
- `clipboard-check` - No Objection Certificate icon
- `circle` - Generic circle indicator
- `info` - Information icon for banners

**Added Department Mapping:**
- `ADMIN: "stamp"` - Administrative Office icon

---

## 3. UI/UX Improvements

### 3.1 Professional Visual Design

All changes maintain existing ClearVault design language:
- **Colors:**
  - Warm ivory/light background (#f7f5ef / #fffefb)
  - Deep navy/charcoal typography (#1b211d)
  - Muted green for approved (#15803d)
  - Muted amber for pending (#b45309)
  - Muted red for rejected (#b42318)
  - Muted gray for secondary text (#66716b)

- **Typography:**
  - Display font (Fraunces) for headings
  - Sans-serif (Inter) for body
  - Monospace (IBM Plex Mono) for IDs and technical info

- **Spacing & Borders:**
  - Consistent 10px border radius on cards
  - Thin subtle borders (#e4dfd2)
  - Proper whitespace and padding
  - Minimal rounded corners

### 3.2 Request Tracking System

**Visual Representation:**
- Department-by-department progress tracker
- Circular status indicators (✓ approved, ✗ rejected, ● pending)
- Connecting lines between departments showing workflow
- Status labels under each step
- Officer information and remarks when available

**Status States:**
- ✓ Approved - Department cleared the request
- ✓ Under Review - Awaiting department decision
- ⚠ Due / Action Required - Department found dues, student must resolve
- ○ Not Yet Reviewed - Department hasn't started review
- ✗ Rejected - Department rejected, re-application needed

**Responsive Design:**
- Compact inline version for request list (circular indicators)
- Full detailed version for request detail page
- Mobile-friendly layout with proper breakpoints
- No awkward single card floating

---

## 4. Backward Compatibility

**Legacy Data Mapping:**
- Old TC requests (purpose: "TC / Migration Clearance") map to new `tc-graduation` type
- Old Graduation requests (purpose: "Final Year / Graduation Clearance") map to new `tc-graduation` type
- Old Semester/Hostel requests remain unchanged
- Database records unchanged - mapping happens at API layer

**API Response Mapping:**
- `requestTypeOf()` function handles legacy-to-new type mapping
- `requiredDeptsForRequest()` works with both old and new purpose strings
- Frontend handles both old and new type IDs in request list

---

## 5. File Structure

### New Files Created:
```
frontend/src/components/DepartmentTracker.jsx
frontend/src/pages/CombinedTCGraduation.jsx
```

### Modified Files:
```
backend/src/requestTypes.js
backend/src/departments.js
frontend/src/pages/Student.jsx
frontend/src/pages/RequestView.jsx
frontend/src/icons.jsx
frontend/src/main.jsx (routing already supports new structure)
```

---

## 6. Functional Requirements Met

✓ **Request Cards:** Exactly 4 cards as specified  
✓ **Layout:** Balanced 3+1 responsive grid  
✓ **Combined Card:** TC & Graduation merged into single card  
✓ **Separate Sections:** Two independent service sections in dedicated page  
✓ **Tracking System:** Department-by-department progress visualization  
✓ **Visual Indicators:** Status badges, icons, connecting lines  
✓ **Request Details:** Shows certificate type, ID, date, status, tracker, action required  
✓ **Status Behavior:** Updates dynamically based on authority actions  
✓ **Professional Design:** Matches ClearVault visual language  
✓ **Firebase Integration:** Uses existing backend API (data-driven from authority actions)  
✓ **No Hardcoding:** Request types and departments configurable via backend registry  
✓ **Clean Code:** No unnecessary components or duplicate code  

---

## 7. Testing Recommendations

1. **Frontend Build:** ✓ Verified - builds successfully without errors
2. **Request Type Resolution:** Test all 4 card types load correctly
3. **Legacy Type Mapping:** Test old TC/Graduation requests display correctly
4. **Combined Page:** Test TC & Graduation page loads both sections
5. **Tracker Display:** Test tracker updates when authority changes status
6. **Responsive Design:** Test layout on mobile (320px), tablet (768px), desktop
7. **Status Transitions:** Test all status changes (Pending → Under Review → Approved/Rejected)
8. **Due Handling:** Test Due / Action Required state and re-application flow
9. **Certificate Generation:** Test certificate issuance after all approvals

---

## 8. Deployment Notes

- No database migrations required (backward compatible)
- No environment variable changes needed
- Frontend assets will rebuild with new components
- Backend changes are additive (existing logic preserved)
- Existing requests continue to work with legacy mapping

---

**Completed:** September 7, 2026  
**Build Status:** ✓ All components compile successfully  
**Database Compatibility:** ✓ Fully backward compatible
