# MSG91 OTP Template Variable Fix

## Issue
SMS is being sent successfully, but the OTP code is missing from the message. The SMS shows:
> "is your OTP for account verification (valid for 10 minutes). Do not share this code with anyone. Regards, Kovans Ventures Private Limited"

But no actual OTP number is displayed.

## Root Cause
The template variable name in the MSG91 API call doesn't match the variable name used in your MSG91 template.

## Solution

### Step 1: Check Your MSG91 Template Variable Name

1. Log in to your MSG91 dashboard
2. Go to **SMS** > **Templates** (or **Flow** section)
3. Find your OTP template (the one with ID: `MSG91_OTP_TEMPLATE_ID`)
4. Check what variable name is used in the template. Common formats:
   - `{{otp}}`
   - `##OTP##`
   - `{otp}`
   - `OTP`
   - `otp`

### Step 2: Update the Code

Once you know the exact variable name, update `supabase/functions/send-otp/index.ts`:

**Current code (line ~260):**
```typescript
const msg91Body: any = {
  template_id: msg91TemplateId,
  sender: "BUCKET",
  short_url: "0",
  mobiles: formattedPhone,
  otp: otp,  // ← This might need to change
};
```

**If your template uses a different variable name, update it:**

**Example 1: If template uses `{{otp}}`**
```typescript
const msg91Body: any = {
  template_id: msg91TemplateId,
  sender: "BUCKET",
  short_url: "0",
  mobiles: formattedPhone,
  "{{otp}}": otp,  // Match the exact variable name
};
```

**Example 2: If template uses `##OTP##`**
```typescript
const msg91Body: any = {
  template_id: msg91TemplateId,
  sender: "BUCKET",
  short_url: "0",
  mobiles: formattedPhone,
  "##OTP##": otp,  // Match the exact variable name
};
```

**Example 3: If template uses `variables` object**
```typescript
const msg91Body: any = {
  template_id: msg91TemplateId,
  sender: "BUCKET",
  short_url: "0",
  mobiles: formattedPhone,
  variables: {
    otp: otp,  // Variable name inside variables object
  },
};
```

### Step 3: Check MSG91 Flow API Documentation

MSG91 Flow API might have specific requirements. Check:
- [MSG91 Flow API Docs](https://docs.msg91.com/sms/send-sms)
- Your MSG91 dashboard for API examples
- MSG91 support if unsure

### Step 4: Test and Deploy

1. Update the code with the correct variable name
2. Deploy the function:
   ```bash
   supabase functions deploy send-otp
   ```
3. Test by sending an OTP
4. Check the function logs:
   ```bash
   supabase functions logs send-otp
   ```
5. Verify the SMS includes the OTP code

## Alternative: Use MSG91 SendOTP API

If the Flow API continues to have issues, consider using MSG91's dedicated SendOTP API instead:

```typescript
// Alternative: MSG91 SendOTP API
const msg91Url = "https://control.msg91.com/api/sendotp.php";
const msg91Body = new URLSearchParams({
  authkey: msg91AuthKey,
  mobile: formattedPhone,
  message: `Your OTP is ${otp}. Valid for 10 minutes.`,
  sender: "BUCKET",
  otp: otp,
  otp_length: "6",
  otp_expiry: "10", // minutes
});
```

## Debugging

Check the function logs to see what's being sent:
```bash
supabase functions logs send-otp --tail
```

Look for the log line:
```
📤 MSG91 SMS Request: { ... }
```

This will show exactly what's being sent to MSG91.

## Next Steps

1. **Find your template variable name** in MSG91 dashboard
2. **Update the code** to match that variable name
3. **Redeploy** the function
4. **Test** and verify OTP appears in SMS

If you're unsure about the variable name, contact MSG91 support or check your template configuration in the MSG91 dashboard.

