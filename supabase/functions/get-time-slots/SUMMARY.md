# Get Time Slots - Supabase Edge Function Summary

## 📁 Created Files

1. **index.ts** - Main edge function implementation
2. **README.md** - Comprehensive documentation
3. **example-usage.ts** - Frontend integration examples
4. **test.ts** - Test suite for validation

## 🎯 Function Overview

**Endpoint:** `POST /functions/v1/get-time-slots`

**Input:**
```json
{
  "name": "Activity Name or Activity ID",
  "date": "2025-12-24"
}
```

**Output:**
```json
{
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "8:00 AM", "value": "08:00" },
    { "label": "10:00 AM", "value": "10:00" }
  ]
}
```

## ✨ Key Features

### 1. Activity-Based Time Slots
- Fetches actual time slots from the `time_slots` table in the database
- Filters by specific activity (supports both name and UUID)
- Returns only the time slots configured for that activity

### 2. Flexible Activity Lookup
- Accepts **activity name** (e.g., "Paragliding Adventure")
- Accepts **activity UUID** (e.g., "a1b2c3d4-...")
- Automatically detects which format is provided
- **Activity Name Mapping**: Translates incoming names to Supabase names
  - Example: "FlyingFox(Tandem/Triple)" → "Fying Fox (Tandem or triple Ride)"
  - Example: "RE Hunter 350cc" → "Royal Enfield Hunter 350 CC"
  - Handles 40+ activity name variations

### 3. Time Zone Handling
- Uses **IST (UTC+5:30)** timezone
- Correctly calculates current time in Indian Standard Time

### 4. Smart Filtering
- **For today's date**: Filters out time slots that have already passed
- **For future dates**: Returns all available time slots

### 5. Standard Time Slots
- Fetches slots with their actual start_time from database
- Formats times in 12-hour display format (e.g., "2:00 PM")
- Returns time values in 24-hour format (e.g., "14:00")

### 6. Validation
- Validates date format (yyyy-mm-dd)
- Validates activity existence
- Returns appropriate error messages
- Handles edge cases gracefully

## 🔄 How It Works

```
Request with activity + date → Lookup activity by name/ID → Query time_slots table
                                                           ↓
                               Check if date is today → Get current IST time
                                                           ↓
                               Filter past slots if today ← Fetch activity's time slots
                                                           ↓
                               Format to 12-hour display ← Return available slots
```

## 🚀 Deployment

### Deploy to Supabase:
```bash
supabase functions deploy get-time-slots
```

### Test Locally:
```bash
# Start the function
supabase functions serve get-time-slots

# In another terminal, test it
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -d '{"name": "Paragliding Adventure", "date": "2025-12-24"}'
```

## 📝 Usage Example

### From React Component:

```typescript
import { supabase } from "@/integrations/supabase/client";

const getTimeSlots = async (activityName: string, date: string) => {
  const { data, error } = await supabase.functions.invoke("get-time-slots", {
    body: { name: activityName, date }
  });
  
  if (error) throw error;
  return data.options;
};

// Usage
const slots = await getTimeSlots("Paragliding Adventure", "2025-12-24");
console.log(slots);
// [
//   { label: "6:00 AM", value: "06:00" },
//   { label: "10:00 AM", value: "10:00" },
//   ...
// ]
```

## 🧪 Testing

Run the test suite:
```bash
cd supabase/functions/get-time-slots
deno run --allow-net test.ts
```

(Make sure to update SUPABASE_URL and SUPABASE_ANON_KEY in test.ts first)

## 📊 Example Scenarios

### Scenario 1: Current time is 11:30 AM, requesting today
**Input:** `{ "name": "Paragliding Adventure", "date": "2025-12-24" }`
**Output:** Only slots from 12:00 PM onwards (filtered from activity's time slots)
```json
{
  "options": [
    { "label": "12:00 PM", "value": "12:00" },
    { "label": "2:00 PM", "value": "14:00" },
    { "label": "4:00 PM", "value": "16:00" }
  ]
}
```

### Scenario 2: Requesting tomorrow's date
**Input:** `{ "name": "Mountain Trekking", "date": "2025-12-25" }`
**Output:** All time slots configured for this activity
```json
{
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "8:00 AM", "value": "08:00" },
    { "label": "10:00 AM", "value": "10:00" },
    { "label": "2:00 PM", "value": "14:00" }
  ]
}
```

## 🎨 Database Configuration

### Time Slots Table
Time slots are stored in the `time_slots` table with the following structure:
- `id` - UUID
- `activity_id` - References the activity
- `start_time` - Time in HH:mm format (e.g., "14:00")
- `end_time` - Time in HH:mm format
- `capacity` - Maximum number of participants

To add or modify time slots for an activity, update the `time_slots` table in your Supabase database.

## 🔐 Security

- Uses CORS headers for cross-origin requests
- Validates all input parameters
- Uses Supabase service role key for database operations
- Implements proper error handling

## 📞 Support

For issues or questions, refer to:
- README.md - Detailed documentation
- example-usage.ts - Integration examples
- test.ts - Testing examples

---

**Status:** ✅ Ready for deployment and use
**Created:** December 24, 2025
**Version:** 1.0.0
