# 🚀 Deployment & Testing Guide

## 📦 Edge Function: get-time-slots

This guide covers deployment and testing for the `get-time-slots` Supabase Edge Function.

---

## 📋 Pre-Deployment Checklist

- [ ] All files are in place in `supabase/functions/get-time-slots/`
- [ ] Activity name mapping object is correctly configured
- [ ] Supabase CLI is installed and configured
- [ ] You have access to your Supabase project

---

## 🚀 Deployment Steps

### Step 1: Verify Supabase CLI

```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it:
# npm install -g supabase
```

### Step 2: Login to Supabase

```bash
# Login if not already logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Deploy the Function

```bash
# Navigate to your project root
cd /Users/divyamshah/Documents/GitHub/bucket-listt/bucketlisttMain

# Deploy the function
supabase functions deploy get-time-slots
```

### Step 4: Verify Deployment

After deployment, you should see:
```
Deployed Function get-time-slots in region us-east-1
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-time-slots
```

---

## 🧪 Testing

### Option 1: Local Testing (Recommended First)

#### Start Local Supabase

```bash
# Terminal 1: Start Supabase locally
supabase start

# Terminal 2: Serve the function
supabase functions serve get-time-slots
```

#### Test with cURL

```bash
# Test 1: Basic request with activity name mapping
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "FlyingFox(Tandem/Triple)",
    "date": "2025-12-26"
  }'

# Test 2: Activity name that needs mapping
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "RE Hunter 350cc",
    "date": "2025-12-26"
  }'

# Test 3: Today's date (will filter past slots)
curl -X POST http://localhost:54321/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Paragliding Adventure",
    "date": "'$(date +%Y-%m-%d)'"
  }'
```

### Option 2: Automated Test Suite

```bash
# Navigate to the function directory
cd supabase/functions/get-time-slots

# Update test.ts with your Supabase URL and Anon Key
# Then run:
deno run --allow-net test.ts
```

### Option 3: Production Testing

```bash
# Replace YOUR_PROJECT_REF with your actual project reference
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-time-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "FlyingFox(Tandem/Triple)",
    "date": "2025-12-26"
  }'
```

---

## ✅ Expected Responses

### Success Response

```json
{
  "options": [
    { "label": "6:00 AM", "value": "06:00" },
    { "label": "10:00 AM", "value": "10:00" },
    { "label": "2:00 PM", "value": "14:00" }
  ]
}
```

### Error Responses

**Missing Activity Name:**
```json
{
  "error": "Activity name is required"
}
```

**Missing Date:**
```json
{
  "error": "Date is required in yyyy-mm-dd format"
}
```

**Invalid Date Format:**
```json
{
  "error": "Invalid date format. Expected yyyy-mm-dd"
}
```

**Activity Not Found:**
```json
{
  "error": "Activity not found",
  "options": []
}
```

---

## 🔍 Debugging

### Check Function Logs

```bash
# View live logs (after deployment)
supabase functions logs get-time-slots --tail

# Or in Supabase Dashboard:
# Project > Edge Functions > get-time-slots > Logs
```

### Common Issues

#### Issue 1: Activity Not Found
**Symptom:** Getting `{ "error": "Activity not found", "options": [] }`

**Solutions:**
1. Check if the activity name exists in the `activities` table
2. Verify the activity is marked as `is_active: true`
3. Check the activity name mapping in `index.ts`
4. Look at the console logs to see mapped name: `Activity name mapping: { original: '...', mapped: '...' }`

#### Issue 2: No Time Slots Returned
**Symptom:** `{ "options": [] }`

**Solutions:**
1. Verify time slots exist in `time_slots` table for this activity
2. Check if the `activity_id` in time_slots matches the activity
3. If testing today, ensure some slots are in the future

#### Issue 3: 500 Internal Server Error
**Solutions:**
1. Check function logs: `supabase functions logs get-time-slots`
2. Verify Supabase environment variables are set correctly
3. Check database permissions

---

## 🔧 Troubleshooting Production

### Enable Detailed Logging

The function already includes logging for name mapping:
```typescript
console.log('Activity name mapping:', { original: name, mapped: mappedName });
```

Check these logs in the Supabase dashboard after making requests.

### Test Different Scenarios

```bash
# Scenario 1: Exact match (no mapping needed)
curl ... -d '{"name": "The OG Bungy Jump", "date": "2025-12-26"}'

# Scenario 2: Name needs mapping
curl ... -d '{"name": "FlyingFox(Tandem/Triple)", "date": "2025-12-26"}'

# Scenario 3: UUID (no mapping)
curl ... -d '{"name": "a1b2c3d4-e5f6-7890-abcd-...", "date": "2025-12-26"}'

# Scenario 4: Today (past filtering)
curl ... -d '{"name": "Paragliding Adventure", "date": "'$(date +%Y-%m-%d)'"}'
```

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Response Time**: Should be < 500ms typically
2. **Error Rate**: Monitor 404s (activity not found) and 500s (server errors)
3. **Request Volume**: Track usage patterns
4. **Mapping Hit Rate**: See console logs for which mappings are used

### Supabase Dashboard

Monitor in: **Project > Edge Functions > get-time-slots**
- Request count
- Error count
- Execution time
- Logs

---

## 🔄 Updating the Function

### When You Need to Add New Activity Mappings

1. Edit `index.ts`
2. Add new mapping to `activityNameMapping` object
3. Redeploy:
   ```bash
   supabase functions deploy get-time-slots
   ```

### Rolling Back

```bash
# View previous deployments
supabase functions list

# If needed, redeploy a previous version
# (You'll need to restore the code from git first)
```

---

## 📝 Integration Testing

### Frontend Integration Test

```typescript
// In your React component
import { supabase } from "@/integrations/supabase/client";

const testEdgeFunction = async () => {
  console.log("Testing get-time-slots edge function...");
  
  const testCases = [
    { name: "FlyingFox(Tandem/Triple)", date: "2025-12-26" },
    { name: "RE Hunter 350cc", date: "2025-12-26" },
    { name: "Paragliding Adventure", date: "2025-12-26" }
  ];
  
  for (const testCase of testCases) {
    const { data, error } = await supabase.functions.invoke("get-time-slots", {
      body: testCase
    });
    
    console.log(`Test: ${testCase.name}`, {
      success: !error,
      slotsCount: data?.options?.length || 0,
      error
    });
  }
};

// Run in browser console or component
testEdgeFunction();
```

---

## ✅ Post-Deployment Checklist

- [ ] Function deployed successfully
- [ ] Test with at least 3 different activity names
- [ ] Verify name mapping works (check logs)
- [ ] Test with today's date (verify past filtering)
- [ ] Test error cases (invalid date, missing name, etc.)
- [ ] Monitor logs for the first hour
- [ ] Update frontend to use the new endpoint

---

## 🆘 Support

If you encounter issues:

1. **Check logs first**: `supabase functions logs get-time-slots`
2. **Review documentation**: See README.md and SUMMARY.md
3. **Test locally**: Use `supabase functions serve` for debugging
4. **Check this guide**: Verify all steps were followed

---

**Status**: Ready for deployment  
**Version**: 1.0.0 (with activity name mapping)  
**Last Updated**: 2024-12-24
