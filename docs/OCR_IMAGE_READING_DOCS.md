# 📸 OCR & Image Reading Documentation

**For the Vyberology Team**

**Status:** OCR function exists but NOT deployed to production
**Issue:** "vision service unavailable" error on thevybe.global
**Priority:** HIGH - Feature is enabled but not working

---

## 🚨 CRITICAL ISSUE

**Problem:** The OCR Edge Function is NOT deployed to Supabase production!

**Location of Code:**
- ✅ Code exists: `/apps/web/supabase/functions/ocr/`
- ❌ NOT deployed: `/supabase/functions/` (where deployment looks)

**The web app calls:** `supabase.functions.invoke("ocr")` but the function doesn't exist on the server!

---

## 📋 Quick Fix Checklist

To fix the "vision service unavailable" error:

1. ✅ **Deploy the OCR function to Supabase:**
   ```bash
   cd /path/to/vyberology
   supabase functions deploy ocr --project-ref agzvrpvuhoruiiugfkzc
   ```

2. ✅ **Set required environment variables in Supabase:**
   - `OPENAI_API_KEY` - Required for GPT-4o-mini vision API
   - Check in Supabase Dashboard → Edge Functions → Configuration

3. ✅ **Test the deployment:**
   - Visit https://thevybe.global
   - Try uploading an image with numbers
   - Should get readings instead of "vision service unavailable"

---

## 🏗️ Architecture Overview

### **Frontend (React Hook)**
**File:** `apps/web/src/features/capture/hooks/useImageProcessing.ts`

**What it does:**
1. Captures/selects image from camera or gallery
2. Compresses image if >5MB (down to max 1920x1920, quality 0.3-0.8)
3. Uploads to Supabase Edge Function via FormData
4. Processes OCR response and extracts numerology readings
5. Saves readings to local history

**Key Functions:**
- `handleCameraCapture()` - Opens camera to take photo
- `handlePickPhoto()` - Opens gallery to select image
- `processImage(imageFile)` - Main OCR processing logic
- `compressImage(file, maxSizeMB)` - Image optimization

---

### **Backend (Supabase Edge Function)**
**Files:**
- `apps/web/supabase/functions/ocr/index.ts` - HTTP server & routing
- `apps/web/supabase/functions/ocr/handler.ts` - Business logic
- `apps/web/supabase/functions/_shared/security.ts` - CORS & rate limiting

**What it does:**
1. Validates CORS origin
2. Rate limits requests (prevents abuse)
3. Converts image to base64 data URL
4. Calls OpenAI GPT-4o-mini Vision API
5. Extracts numbers from image using AI
6. Returns structured numerology readings

**OpenAI API:**
- Model: `gpt-4o-mini` (fast & cost-effective)
- Prompt: "Extract ALL numbers from this image. Include times (11:11), percentages (75%), repeating numbers (222), phone numbers, license plates, prices, order IDs, etc."
- Max tokens: 500
- Returns: Plain text list of numbers found

---

## 🔧 Technical Details

### **Image Processing Flow**

```
User Action
    ↓
[Camera/Gallery]
    ↓
Capture/Select Image
    ↓
[Compress if >5MB] ← Canvas resize & quality adjustment
    ↓
Create FormData
    ↓
POST to supabase.functions.invoke("ocr")
    ↓
[Edge Function]
    ├── CORS validation
    ├── Rate limiting check
    ├── Convert to base64
    ├── Call OpenAI Vision API
    └── Extract numbers
    ↓
Return numerology readings[]
    ↓
Save to local history
    ↓
Display to user
```

---

### **Image Compression Algorithm**

```typescript
// From useImageProcessing.ts lines 57-129

1. Check if file size > maxSizeMB (default 5MB)
2. If too large:
   a. Load image into canvas
   b. Calculate new dimensions (max 1920x1920, keep aspect ratio)
   c. Draw resized image on canvas
   d. Try compression at quality 0.8
   e. If still too large, reduce quality by 0.1 and retry
   f. Stop at quality 0.3 minimum
3. Return compressed JPEG
```

**Why this matters:**
- Reduces upload time
- Saves bandwidth costs
- OpenAI Vision API has file size limits
- Mobile devices have limited memory

---

### **OCR Request/Response Format**

**Request to Edge Function:**
```typescript
FormData {
  screenshot: File (JPEG/PNG image)
}
```

**Response from Edge Function:**
```typescript
{
  readings: [
    {
      input_text: string,          // e.g. "11:11", "222", "75%"
      normalized_number: string,   // e.g. "11", "6", "7"
      numerology_data: {
        headline: string,          // Brief reading title
        keywords: string[],        // Key themes
        guidance: string          // Full reading text
      },
      chakra_data: {
        name: string,             // Chakra name
        element: string,          // Earth, Water, Fire, etc.
        focus: string,            // Chakra focus area
        color: string,            // Hex color code
        amplified?: boolean,      // Special state
        message?: string          // Extra guidance
      }
    }
  ],
  meta: {
    model: "gpt-4o-mini",
    mode: "fast" | "accurate",
    usage: {
      prompt_tokens: number,
      completion_tokens: number,
      total_tokens: number
    }
  }
}
```

**Error Response:**
```typescript
{
  error: string,        // Error message
  message?: string,     // Detailed error info
  status?: number       // HTTP status code
}
```

---

## 🔐 Security Features

### **CORS (Cross-Origin)**
**File:** `supabase/functions/_shared/security.ts`

- Only allows requests from `thevybe.global` and `localhost`
- Rejects unauthorized origins with 403
- OPTIONS preflight handling for complex requests

### **Rate Limiting**
- Tracks requests per IP address
- Stored in Supabase database
- Prevents abuse and cost overruns
- Returns 429 if limit exceeded

### **Error Logging**
**File:** `supabase/functions/_shared/errorLogger.ts`

- Logs all errors to Supabase Edge Logs
- Includes request context (IP, user agent, etc.)
- Tracks OpenAI API errors separately
- Helps debug production issues

---

## 🐛 Common Errors & Solutions

### **1. "vision service unavailable"**
**Cause:** OCR function not deployed to Supabase
**Fix:** Deploy the function (see Quick Fix above)

### **2. "OpenAI API key not configured"**
**Cause:** Missing `OPENAI_API_KEY` environment variable
**Fix:** Add to Supabase Dashboard → Edge Functions → Configuration

### **3. "Rate limit exceeded"**
**Cause:** Too many requests from same IP
**Fix:** Wait a few minutes, implement user-side throttling

### **4. "Image too large"**
**Cause:** Image compression failed, file still >5MB
**Fix:** Implement stricter compression or reject large images earlier

### **5. "No numbers detected"**
**Cause:** Image has no visible numbers OR OCR failed
**Fix:**
- Improve image quality guidance for users
- Add retry logic
- Consider fallback to manual input

### **6. "OpenAI error 429"**
**Cause:** OpenAI rate limit or quota exceeded
**Fix:**
- Check OpenAI billing
- Implement request queuing
- Add user feedback about high load

---

## 💰 Cost Considerations

### **OpenAI GPT-4o-mini Vision Pricing (as of Oct 2024)**
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Images count as ~765 tokens (varies by size)

**Estimated cost per image:**
- Input: 765 tokens (image) + ~50 tokens (prompt) = 815 tokens
- Output: ~100 tokens (extracted numbers)
- **Total: ~$0.0001 per image** (very cheap!)

**At 10,000 images/day:**
- Daily cost: ~$1
- Monthly cost: ~$30

### **Supabase Edge Functions**
- 500K requests/month free
- $2 per 1M requests after that

**Storage (if storing images):**
- 1GB free
- $0.021/GB/month after

---

## 🧪 Testing

### **Test Locally:**
```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions deploy ocr --no-verify-jwt

# Test with curl
curl -X POST http://localhost:54321/functions/v1/ocr \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "data:image/jpeg;base64,..."}'
```

### **Test in Production:**
1. Go to https://thevybe.global
2. Click camera/upload button
3. Take photo or select image with visible numbers (11:11, 222, etc.)
4. Wait for processing
5. Check console for logs:
   - `[OCR] Starting OCR Process`
   - `[OCR] Compressed to: X.XX MB`
   - `[OCR] Response received in X seconds`
   - `[OCR] Success! Found X readings`

---

## 📱 Mobile Considerations

### **Camera Permissions**
**File:** `apps/web/src/lib/permissions.ts`

- iOS Safari requires HTTPS
- Android Chrome requires user gesture
- Permission states: 'prompt', 'granted', 'denied'
- Handle permission denied gracefully

### **Image Capture Methods**
1. **`capturePhoto()`** - Opens native camera
2. **`pickPhoto()`** - Opens gallery picker

Both return:
```typescript
{
  success: boolean,
  data?: string,      // base64 data URL
  error?: string
}
```

### **Performance**
- Compression happens on device (uses Canvas API)
- Can be slow on older devices
- Show loading state to user
- 3-second cooldown after failed attempts

---

## 🔮 Future Improvements

1. **Batch Processing**
   - Upload multiple images at once
   - Process in parallel
   - Return all readings together

2. **Image Quality Detection**
   - Check if image is blurry before uploading
   - Guide user to retake if needed
   - Use client-side image analysis

3. **Caching**
   - Cache OCR results by image hash
   - Avoid re-processing same image
   - Store in Supabase database

4. **Offline Support**
   - Queue images when offline
   - Process when connection returns
   - Use Service Worker for reliability

5. **Better Error Recovery**
   - Automatic retry with exponential backoff
   - Fallback to manual number input
   - Show partial results if available

6. **Analytics**
   - Track success/failure rates
   - Monitor processing times
   - Identify common error patterns

---

## 📞 Support

**For issues:**
1. Check Supabase Edge Function logs
2. Check browser console for `[OCR]` logs
3. Verify OpenAI API key is set
4. Test with simple image (screenshot of "11:11")

**Contacts:**
- Emperor Tungsten: tung.nguyen@hwinnwin.com
- GitHub Issues: https://github.com/hwinnwin/Vyberology/issues

---

## 📝 File Reference

**Frontend:**
- `apps/web/src/features/capture/hooks/useImageProcessing.ts` - Main hook
- `apps/web/src/lib/permissions.ts` - Camera/gallery permissions
- `apps/web/src/lib/readingHistory.ts` - Save readings locally
- `apps/web/src/pages/GetVybe.tsx` - UI that uses the hook

**Backend:**
- `apps/web/supabase/functions/ocr/index.ts` - HTTP server
- `apps/web/supabase/functions/ocr/handler.ts` - Business logic
- `supabase/functions/_shared/security.ts` - CORS & rate limiting
- `supabase/functions/_shared/errorLogger.ts` - Error tracking

**Tests:**
- `apps/web/supabase/functions/ocr/handler.test.ts` - Unit tests

---

**Generated:** October 28, 2025
**Status:** OCR function exists but needs deployment
**Next Step:** Deploy to fix "vision service unavailable"

🤖 Documented by Claude Code for Emperor Tungsten & Team
