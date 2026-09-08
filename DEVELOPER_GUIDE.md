# ClearVault - Developer Implementation Guide

## For Developers Maintaining or Extending the System

### Key Files Changed/Created

| File | Type | What Changed |
|------|------|--------------|
| `backend/src/requestTypes.js` | Modified | ✏️ Request types reduced from 5 to 4, added combined TC&Grad |
| `backend/src/departments.js` | Modified | ✏️ Added ADMIN department for Study Certificate |
| `frontend/src/components/DepartmentTracker.jsx` | **NEW** | ✨ Tracking visualization component |
| `frontend/src/pages/CombinedTCGraduation.jsx` | **NEW** | ✨ Combined TC & Graduation service page |
| `frontend/src/pages/Student.jsx` | Modified | ✏️ Grid layout, type mapping, request list redesign |
| `frontend/src/pages/RequestView.jsx` | Modified | ✏️ Redirect logic, tracker integration, styling |
| `frontend/src/icons.jsx` | Modified | ✏️ Added new icons (award, check-circle, etc.) |

---

## Core Concepts

### 1. Request Types are Central

```javascript
// backend/src/requestTypes.js

REQUEST_TYPES = [
  {
    id: "...",           // unique identifier for URL routing
    title: "...",        // display name on student dashboard
    blurb: "...",        // description text
    purpose: "...",      // stored in DB - legacy compatibility
    icon: "...",         // icon name from icons.jsx
    requires: ["..."],   // departments required for approval
  }
]
```

**Why this matters:**
- Changing `requires` automatically updates backend approvals, API response, and frontend tracker
- `purpose` field ensures legacy data (old TC/Graduation requests) maps correctly
- No frontend hardcoding needed — it's all data-driven

### 2. Type Mapping for Legacy Data

```javascript
// When student has old "TC / Migration Clearance" request in DB

function requestTypeOf(request) {
  // Looks up REQUEST_TYPES by `purpose` field
  // If purpose matches old TC: returns "tc-graduation"
  // If purpose matches old Graduation: returns "tc-graduation"
  // If purpose is custom: slugifies and returns kebab-case
}
```

**When to use:**
- Reading from requests list (GET /api/requests/list)
- Matching old requests to new UI structure
- URL routing (/student/request/{type})

### 3. DepartmentTracker Component is Flexible

```jsx
// Two modes - same component, different output

// Compact mode (request list)
<DepartmentTracker clearances={clearances} compact={true} />
// Output: [✓][✓][●][●] (inline circles)

// Detailed mode (request view)
<DepartmentTracker clearances={clearances} compact={false} />
// Output: Vertical tracker with department names, status, officer info
```

**Props:**
- `clearances` - array of clearance objects from API
- `compact` - boolean (default false for backward compatibility)

**How it handles data:**
- Extracts status, deptName, officerTitle from each clearance
- Independently renders each step
- Works with any number of departments (1 to N)
- Auto-responsive based on content length

### 4. Real-Time Updates Mechanism

The frontend polls the API periodically:

```javascript
// Student.jsx polls every 8 seconds
// RequestView.jsx polls every 5 seconds
// CombinedTCGraduation.jsx polls on mount (loadRequests)

useEffect(() => {
  const t = setInterval(() => {
    load().catch(() => {}); // Silent fail if offline
  }, 5000);
  
  return () => clearInterval(t);
}, []);
```

**Important:**
- Polling is one-way (frontend → backend only)
- No WebSocket, no push notifications (by design)
- Eventual consistency model
- Works on slow/unreliable networks

**When adding new real-time features:**
- Keep polling pattern for backward compatibility
- Don't add WebSocket without major version bump
- Test offline scenarios

---

## Common Modification Scenarios

### Scenario 1: Add a New Request Type

**Changes needed:**

1. **Backend (requestTypes.js):**
```javascript
export const REQUEST_TYPES = [
  // ... existing types
  {
    id: "my-new-cert",
    title: "My New Certificate",
    blurb: "Description here",
    purpose: "My New Certificate Purpose",
    icon: "icon-name",
    requires: ["FINANCE", "LIBRARY"],  // Which depts approve it
  }
];
```

2. **Backend (departments.js):**
- Add new department if needed, or use existing ones

3. **Frontend (icons.jsx):**
- Add icon if it doesn't exist:
```javascript
"icon-name": ["M... path data ..."]
```

4. **Frontend (Student.jsx):**
- No changes needed! Grid will auto-update
- Request card will render automatically from REQUEST_TYPES

5. **Test:**
```bash
# Frontend rebuild
cd frontend && npm run build

# API response should include new type
curl http://localhost/api/request-types
```

**Result:** New card automatically appears on dashboard with correct department requirements!

### Scenario 2: Change Department Approval Chain

**Example:** "No-Due Certificate" should also require Dean approval

**Changes needed:**

1. **Backend (requestTypes.js):**
```javascript
{
  id: "no-due-certificate",
  requires: ["FINANCE", "LIBRARY", "HOSTEL", "SPORTS", "DEAN"],  // Added DEAN
}
```

2. **That's it!**
   - API returns 5 departments now
   - Frontend tracker auto-renders 5 steps
   - Database doesn't need migration
   - Old requests still work with 4-step tracker
   - New requests get 5-step tracker

### Scenario 3: Add New Department

**Example:** Add "Registrar Office"

**Changes needed:**

1. **Backend (departments.js):**
```javascript
{
  id: "REGISTRAR",
  code: "REG",
  name: "Registrar Office",
  short: "Registrar",
  officerTitle: "Registrar",
  icon: "stamp",
  legacy: [],
  checks: ["...", "..."],
}
```

2. **Backend (requestTypes.js):**
- Update any type that should require REGISTRAR approval:
```javascript
requires: ["FINANCE", "LIBRARY", "REGISTRAR", ...] // Added REGISTRAR
```

3. **Frontend (icons.jsx):**
- Ensure icon exists or add it

4. **Test:**
```bash
# New department should appear in API
curl http://localhost/api/request-types | grep -A5 "no-due-certificate"
# Should show REGISTRAR in requires array
```

### Scenario 4: Change Tracker Styling

**Example:** Use different colors for status indicators

**Changes needed:**

1. **Only in DepartmentTracker.jsx:**
```jsx
const statusInfo = (status) => {
  switch (status) {
    case "APPROVED":
      return { 
        label: "Approved", 
        color: "text-good",  // Change this
        bg: "bg-good/10",    // Or this
        icon: "check" 
      };
    // ... rest
  }
};
```

2. **Or use Tailwind CSS custom classes** in theme.css

3. **That's it!** No changes needed elsewhere

---

## Potential Issues & Solutions

### Issue 1: Tracker Shows Wrong Number of Steps

**Symptom:** Request shows 5 steps but only 4 departments should be required

**Diagnosis:**
1. Check request `type` in Student.jsx request list
2. Call `requestTypeOf(request)` to get mapped type
3. Check REQUEST_TYPES for that type's `requires` array
4. Verify database clearances match

**Fix:** Use `requestTypeOf()` mapping, not raw request type

```javascript
// Wrong:
const type = request.type; // Might be "tc" for old data

// Right:
const type = requestTypeOf(request); // Always returns "tc-graduation"
```

### Issue 2: Department Icon Not Showing

**Symptom:** ❌ appears instead of department icon in tracker

**Diagnosis:**
1. Check DEPT_ICON mapping in icons.jsx
2. Verify department ID is in map
3. Check icon name exists in paths object

**Fix:**
```javascript
// In icons.jsx
export const DEPT_ICON = {
  "YOUR_DEPT": "icon-name",  // Add this line
  // ...
};
```

### Issue 3: Request List Shows 5 Departments, Should Be 4

**Symptom:** Old "No-Due" request showing 5 cleared instead of 4

**Diagnosis:** 
- Old request type had 4 requirements
- Department was added after request was created
- API returns current requirements, not historical

**Note:** This is expected behavior. Old requests show their actual approval chain.

### Issue 4: Tracker Doesn't Update After Officer Approves

**Symptom:** Officer approves department, but student still sees PENDING

**Diagnosis:**
1. Is polling running? Check browser console for API calls every 5s
2. Did office actually save approval? Check Staff panel
3. Is polling interval long? (might take up to 8s to see update)

**Fix:**
- Hard refresh page: Cmd+Shift+R
- Check network tab for GET /api/requests/{id}
- Verify response has updated status

### Issue 5: Combined Page Not Showing Both Services

**Symptom:** CombinedTCGraduation page loads but TC or Graduation section is missing

**Diagnosis:**
1. Check if requests exist in `existing` state
2. Verify legacy type mapping is working
3. Check request IDs in console

**Fix:**
```javascript
// In CombinedTCGraduation.jsx
const tcRequests = requests.filter(
  r => r.purpose === "TC / Migration Clearance" || r.type === "tc"
);
// Make sure both conditions are checked
```

---

## Testing Checklist

### Before Deployment

- [ ] Build command succeeds without errors
- [ ] `npm run build` completes in frontend
- [ ] No console errors in browser
- [ ] All 4 request cards display
- [ ] Request cards are properly aligned (3+1, not awkward single)
- [ ] Click request card → correct page loads
- [ ] Request list shows correct tracker indicators
- [ ] Tracker updates within 8 seconds of authority action
- [ ] Old TC/Graduation requests still work (legacy mapping)
- [ ] DepartmentTracker renders with correct number of steps
- [ ] Status colors match design spec
- [ ] Icons display correctly for all departments
- [ ] Offline state handled gracefully
- [ ] Mobile responsive (test on 320px, 768px, 1024px+)
- [ ] Certificate issuance works (all departments approved)
- [ ] Rejection flow works (student can re-apply)
- [ ] Combined TC&Graduation page loads and both sections visible

### Performance Testing

- [ ] Polling requests don't cause memory leaks
- [ ] Multiple open requests doesn't slow down page
- [ ] Large number of departments (20+) renders efficiently
- [ ] No layout shift when tracker updates

### Edge Cases

- [ ] Empty requests list shows proper message
- [ ] Cancelled request shows frozen state
- [ ] Request from "future" (impossible status) handled gracefully
- [ ] Very long department name doesn't break layout
- [ ] Very long officer remarks display truncated with ellipsis

---

## Performance Optimization Tips

### If Polling Causes High Load

Currently polls every 5-8 seconds. To reduce:

```javascript
// Increase interval (slower updates)
const t = setInterval(() => load(), 15000); // 15s instead of 5s

// Or: Only poll if page is visible
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInterval(t);
  else t = setInterval(() => load(), 5000);
});
```

### If Request List Gets Slow

With many requests:

```javascript
// Virtualize request list (render only visible items)
import { FixedSizeList } from "react-window";

// Or: Paginate requests
const PAGE_SIZE = 20;
const pages = Math.ceil(requests.length / PAGE_SIZE);
```

### If Tracker Re-renders Unnecessarily

```javascript
// Memoize DepartmentTracker
import { memo } from "react";
const MemoizedTracker = memo(DepartmentTracker);

// Or: Memoize clearances array
const memoizedClearances = useMemo(() => clearances, [JSON.stringify(clearances)]);
```

---

## Documentation Links

- [API Contracts](./API_AND_TRACKING.md)
- [Visual Architecture](./VISUAL_ARCHITECTURE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

## Common Questions

**Q: Can I have different colors for different request types?**
A: Yes, pass a `variant` prop to DepartmentTracker and handle it in statusInfo

**Q: How do I add email notifications when status changes?**
A: Backend already sends them (notify() function in store.supabase.js). Just ensure notificationSubscriptions are set up.

**Q: Can I disable polling and use WebSockets instead?**
A: Yes, but maintain backward compatibility. Add WebSocket support as opt-in feature, keep polling as fallback.

**Q: How do I export tracker data to PDF?**
A: DepartmentTracker is pure React. Use react-pdf or html2canvas library to capture tracker element.

**Q: What if officer's name is very long?**
A: CSS text-overflow: ellipsis with max-width handles it. Tooltip on hover shows full name.

---

**Last Updated:** September 7, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
