# Quick Reference - Get Time Slots Edge Function

## 📦 What Was Created

A Supabase Edge Function that fetches time slots for a specific activity based on date, with automatic filtering of past slots for today's date.

## 🎯 Request Format

```typescript
{
  name: "Activity Name" | "activity-uuid",  // Required
  date: "2025-12-24"                        // Required (yyyy-mm-dd)
}
```

## ✅ Response Format

```typescript
{
  options: [
    { label: "6:00 AM", value: "06:00" },
    { label: "2:00 PM", value: "14:00" }
  ]
}
```

## 🚀 Quick Deploy

```bash
supabase functions deploy get-time-slots
```

## 🧪 Quick Test (Local)

```bash
# Terminal 1: Start function
supabase functions serve get-time-slots

# Terminal 2: Test it
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -d '{"name": "Paragliding Adventure", "date": "2025-12-24"}'
```

## 💡 Quick Integration

```typescript
// In your React component
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase.functions.invoke("get-time-slots", {
  body: {
    name: "Paragliding Adventure",  // Or activity UUID
    date: "2025-12-24"
  }
});

const timeSlots = data.options;
// [{ label: "6:00 AM", value: "06:00" }, ...]
```

## 🔑 Key Features

✅ Fetches from database (time_slots table)  
✅ Filters by activity  
✅ Supports activity name OR UUID  
✅ **Activity name mapping** (40+ variations handled)  
✅ Auto-filters past slots for today  
✅ IST timezone (UTC+5:30)  
✅ 12-hour format display  
✅ 24-hour format values  

### Activity Name Mapping Examples
- "FlyingFox(Tandem/Triple)" → "Fying Fox (Tandem or triple Ride)"
- "RE Hunter 350cc" → "Royal Enfield Hunter 350 CC"
- "BungyJump+Cut Chord Rope" → "Bungy Jump + Valley Rope Jump/Cut chord rope"  

## 📊 How It Works

1. **Receives** activity name/ID + date
2. **Looks up** activity in database
3. **Fetches** time slots for that activity
4. **Checks** if date is today
5. **Filters** past slots if today
6. **Returns** formatted options

## ⚠️ Error Handling

- Missing name → `{ error: "Activity name is required" }`
- Missing date → `{ error: "Date is required in yyyy-mm-dd format" }`
- Invalid date format → `{ error: "Invalid date format. Expected yyyy-mm-dd" }`
- Activity not found → `{ error: "Activity not found", options: [] }`

## 📁 Files Created

```
supabase/functions/get-time-slots/
├── index.ts              # Main edge function
├── README.md             # Full documentation
├── SUMMARY.md            # Detailed summary
├── example-usage.ts      # Frontend integration examples
├── test.ts               # Test suite
└── QUICK_REFERENCE.md    # This file
```

## 🎓 Example Use Cases

### Use Case 1: Today's Slots (Past Filtered)
```json
Request: {
  "name": "Paragliding",
  "date": "2025-12-24"  // Today, current time 11:30 AM
}

Response: {
  "options": [
    { "label": "12:00 PM", "value": "12:00" },  // ✅ Future
    { "label": "2:00 PM", "value": "14:00" }    // ✅ Future
    // 6:00 AM, 8:00 AM, 10:00 AM filtered out ❌ (past)
  ]
}
```

### Use Case 2: Future Date (All Slots)
```json
Request: {
  "name": "Mountain Trekking",
  "date": "2025-12-25"  // Tomorrow
}

Response: {
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "8:00 AM", "value": "08:00" },
    { "label": "10:00 AM", "value": "10:00" },
    { "label": "2:00 PM", "value": "14:00" }
  ]
}
```

### Use Case 3: Using Activity UUID
```json
Request: {
  "name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-12-26"
}

Response: {
  "options": [...] // Time slots for that activity
}
```

## 🔄 Integration with SlotSelector

Based on your SlotSelector.tsx component, you can integrate like this:

```typescript
// Add to SlotSelector.tsx or create a new hook
const { data: timeSlotsFromEdge } = useQuery({
  queryKey: ["time-slots-edge", selectedActivityId, selectedDate],
  queryFn: async () => {
    if (!selectedActivityId || !selectedDate) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data, error } = await supabase.functions.invoke("get-time-slots", {
      body: {
        name: selectedActivityId,
        date: dateStr
      }
    });
    
    if (error) throw error;
    return data.options;
  },
  enabled: !!selectedActivityId && !!selectedDate,
});
```

---

**Status**: ✅ Ready for deployment  
**Version**: 1.0.0  
**Created**: 2025-12-24
