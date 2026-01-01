# CORS Fix for send-otp Edge Function

## Issue
Getting CORS error when calling the `send-otp` edge function.

## Fixes Applied

1. **Added `Access-Control-Allow-Methods` header** - Required by some browsers
2. **Added `Access-Control-Max-Age` header** - Caches preflight requests
3. **Ensured OPTIONS handler returns status 200** - Proper preflight response
4. **All error responses include CORS headers** - Even error cases return CORS headers

## Deployment Required

The edge function needs to be deployed to Supabase:

```bash
# Deploy the send-otp function
supabase functions deploy send-otp

# Also deploy the other OTP-related functions
supabase functions deploy verify-otp
supabase functions deploy signup-with-otp
supabase functions deploy signin-with-otp
```

## Testing After Deployment

1. **Test locally first** (optional):
```bash
supabase functions serve send-otp
```

2. **Test from browser console**:
```javascript
const { data, error } = await supabase.functions.invoke("send-otp", {
  body: {
    email: "test@example.com",
    type: "email"
  }
});
console.log({ data, error });
```

3. **Check function logs**:
```bash
supabase functions logs send-otp
```

## If CORS Error Persists

1. **Verify function is deployed**: Check Supabase Dashboard > Edge Functions
2. **Check browser console**: Look for the exact CORS error message
3. **Verify environment variables**: Make sure `RESEND_API_KEY` is set
4. **Check function logs**: Look for any runtime errors

## Updated CORS Headers

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

All responses (success, error, OPTIONS) now include these headers.

