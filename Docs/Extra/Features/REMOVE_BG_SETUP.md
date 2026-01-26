# Background Removal Feature Setup

> **Source of truth:** `services/wardrobe/backgroundRemover.ts`.

## Overview

Background removal in Obrazz is **multi-provider**:

- **iOS (primary):** Apple Vision (on-device) via `SubjectLifter` — **no API keys required**
- **Fallback (Android / unsupported iOS / Simulator / failures):** **Pixian.ai API** — requires credentials

## Current Status

✅ **Feature is implemented**

- iOS on-device Apple Vision works without any env vars (dev build required)
- Pixian fallback requires env vars below

---

## How to Enable

### Step 1: Get Pixian.ai credentials

1. Create a Pixian.ai account
2. Get API ID + API Secret

### Step 2: Add credentials to Environment

1. Open your `.env` file in the project root
2. Find or add these lines:
   ```env
   EXPO_PUBLIC_PIXIAN_API_ID=your_pixian_id
   EXPO_PUBLIC_PIXIAN_API_SECRET=your_pixian_secret
   # Optional: free test mode (watermark)
   EXPO_PUBLIC_PIXIAN_TEST_MODE=true
   ```
3. Replace the values with your Pixian.ai credentials
4. Save the file

### Step 3: Restart the App

```bash
# Stop the current Metro bundler (Ctrl+C)
# Then restart with cleared cache
npx expo start --clear
```

### Step 4: Test the Feature

1. Open the app
2. Navigate to Wardrobe tab
3. Tap the "+" button to add an item
4. Take or select a photo
5. Trigger background removal:
   - On a real iOS device (iOS 16+): should use Apple Vision
   - On Android / iOS Simulator / unsupported iOS: should use Pixian fallback

---

## Troubleshooting

### "Pixian.ai API credentials not configured"

**Cause:** Pixian fallback is needed (Android / Simulator / unsupported iOS), but env vars are missing.

**Solution:** Add `EXPO_PUBLIC_PIXIAN_API_ID` and `EXPO_PUBLIC_PIXIAN_API_SECRET` to `.env` and restart with `npx expo start --clear`.

### Background removal always uses Pixian on iOS

**Common causes:**

- Running on **iOS Simulator** (Apple Vision is unavailable there)
- iOS version is < 16
- Dev build not used (Expo Go)

**Fix:** Test on a real iPhone/iPad with a dev build.

**Cause:** API key not configured or app not restarted.

**Solution:**

1. Check `.env` file has the correct key
2. Restart Metro bundler with `--clear` flag
3. Reload the app

### Background Removal Fails

**Possible causes (Pixian fallback):**

- Network connection issues / VPN / DNS
- Pixian API outage or rate limits
- Image too large (app may downscale before upload)

**Solution:**

- Check your API usage in Remove.bg dashboard
- Try a different image
- Check internet connection
- Compress large images before uploading

---

## Alternative: Manual Background Removal

If you don't want to use the API, you can:

1. Remove backgrounds manually using photo editing apps
2. Upload pre-processed images with transparent backgrounds
3. Use the items as-is with backgrounds

---

## Future Improvements

Planned enhancements for this feature:

- Local background removal using AI (no API needed)
- Batch processing for multiple items
- Custom background colors
- Background blur option
- Integration with other background removal services

---

## Cost Considerations

### Free Tier (Current)

- 50 API calls/month
- $0.00/month
- Perfect for personal use

### Paid Plans (If Needed)

- Subscription: Starting at $9/month for 500 credits
- Pay-as-you-go: $0.20 per image
- Enterprise: Custom pricing

For most users, the free tier is sufficient for testing and personal wardrobe management.

---

## Privacy & Security

- API key is stored locally in `.env` file
- Never committed to version control (`.env` is in `.gitignore`)
- Images are sent to Remove.bg servers for processing
- Processed images are stored locally on your device
- Remove.bg privacy policy: https://www.remove.bg/privacy

---

## Summary

**For Testing/Development:**

- Skip this feature for now
- Focus on core wardrobe functionality
- Add items with regular photos

**For Production/Personal Use:**

- Get a free API key (takes 2 minutes)
- Add to `.env` file
- Enjoy professional-looking item photos

**For Enterprise:**

- Consider self-hosted AI solutions
- Implement local background removal
- Evaluate cost vs. benefit

---

**Status:** Optional Feature - Not Required for App Functionality ✅

_Last Updated: 2025-01-14_
