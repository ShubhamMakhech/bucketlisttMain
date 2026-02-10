# Get Time Slots Edge Function

This Supabase Edge Function returns available time slots for a specific activity based on the provided date. If the date is today, it filters out time slots that have already passed.

## Endpoint

```
POST /functions/v1/get-time-slots
```

## Request Body

```json
{
  "name": "Activity Name or Activity ID",
  "date": "2025-12-24"
}
```

### Parameters

- `name` (required): The name or UUID of the activity to get time slots for
- `date` (required): Date in `yyyy-mm-dd` format

## Response Format

```json
{
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "8:00 AM", "value": "08:00" },
    { "label": "10:00 AM", "value": "10:00" },
    { "label": "12:00 PM", "value": "12:00" },
    { "label": "2:00 PM", "value": "14:00" },
    { "label": "4:00 PM", "value": "16:00" },
    { "label": "6:00 PM", "value": "18:00" },
    { "label": "8:00 PM", "value": "20:00" }
  ]
}
```

## Features

1. **Activity-Based Time Slots**: Fetches actual time slots from the database for a specific activity
2. **Activity Lookup**: Supports both activity name and activity UUID/ID for flexibility
3. **Activity Name Mapping**: Automatically translates incoming activity names to Supabase activity names (handles variations in naming)
4. **Time Zone Handling**: Uses IST (UTC+5:30) timezone
5. **Today's Date Filtering**: Automatically filters out past time slots if the date is today
6. **Format Validation**: Validates the date format (yyyy-mm-dd)

## Example Usage

### For Today's Date
If the current time is 11:30 AM and you request today's date, the function will only return slots starting from 12:00 PM onwards (based on the activity's configured time slots).

**Request:**
```json
{
  "name": "Paragliding Adventure",
  "date": "2025-12-24"
}
```

**Response (assuming current time is 11:30 AM IST and activity has slots at 10:00, 12:00, 14:00, 16:00):**
```json
{
  "options": [
    { "label": "12:00 PM", "value": "12:00" },
    { "label": "2:00 PM", "value": "14:00" },
    { "label": "4:00 PM", "value": "16:00" }
  ]
}
```

### For Future Date
For any future date, all configured time slots for the activity are returned.

**Request:**
```json
{
  "name": "Mountain Trekking",
  "date": "2025-12-25"
}
```

**Response (returns all time slots configured for this activity):**
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

### Using Activity ID (UUID)
You can also pass the activity UUID directly:

**Request:**
```json
{
  "name": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-12-25"
}
```

**Response:**
```json
{
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "8:00 AM", "value": "08:00" },
    { "label": "10:00 AM", "value": "10:00" },
    { "label": "12:00 PM", "value": "12:00" },
    { "label": "2:00 PM", "value": "14:00" },
    { "label": "4:00 PM", "value": "16:00" },
    { "label": "6:00 PM", "value": "18:00" },
    { "label": "8:00 PM", "value": "20:00" }
  ]
}
```

### Using Activity Name Mapping
The function automatically translates incoming activity names to match Supabase names:

**Request (with mapped name):**
```json
{
  "name": "FlyingFox(Tandem/Triple)",
  "date": "2025-12-25"
}
```

This will automatically be translated to "Fying Fox (Tandem or triple Ride)" when querying the database.

**Another example:**
```json
{
  "name": "RE Hunter 350cc",
  "date": "2025-12-25"
}
```

This will be translated to "Royal Enfield Hunter 350 CC" in the database query.

## Deployment

Deploy this function using the Supabase CLI:

```bash
supabase functions deploy get-time-slots
```

## Testing Locally

You can test this function locally using:

```bash
supabase functions serve get-time-slots
```

Then make a request:

```bash
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -d '{"name": "Paragliding Adventure", "date": "2025-12-24"}'
```

## Error Handling

The function returns appropriate error messages for:
- Missing activity name parameter
- Missing date parameter
- Invalid date format
- Activity not found
- Server errors

Example error responses:
```json
{
  "error": "Activity name is required"
}
```

```json
{
  "error": "Activity not found",
  "options": []
}
```
