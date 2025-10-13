# Background Removal Feature Setup

## Overview

The background removal feature is **optional** and uses the Remove.bg API to automatically remove backgrounds from clothing item photos. This creates clean, professional-looking images for your wardrobe.

---

## Current Status

✅ **Feature is implemented but disabled** - The "Remove BG" button will only appear when an API key is configured.

---

## How to Enable (Optional)

### Step 1: Get a Remove.bg API Key

1. Visit https://www.remove.bg/api
2. Click "Get API Key" or "Sign Up"
3. Create a free account
4. Navigate to your dashboard
5. Copy your API key

### Step 2: Add API Key to Environment

1. Open your `.env` file in the project root
2. Find or add this line:
   ```env
   EXPO_PUBLIC_REMOVE_BG_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual API key
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
5. You should now see the "Remove BG" button
6. Tap it to remove the background

---

## Free Tier Limits

Remove.bg offers a free tier with:

- **50 API calls per month**
- Preview quality images (0.25 megapixels)
- Good enough for testing and personal use

For production use, consider upgrading to a paid plan.

---

## How It Works Without API Key

If you don't configure the API key:

- ✅ The app works perfectly fine
- ✅ You can still add items with photos
- ✅ The "Remove BG" button is hidden
- ✅ No errors or warnings shown to users

The feature is completely optional!

---

## Troubleshooting

### "API Key invalid" Error

**Cause:** The API key in your `.env` file is incorrect or expired.

**Solution:**

1. Check that you copied the entire API key
2. Ensure there are no extra spaces
3. Verify the key is still active in your Remove.bg dashboard
4. Restart the app after updating

### "Remove BG" Button Not Showing

**Cause:** API key not configured or app not restarted.

**Solution:**

1. Check `.env` file has the correct key
2. Restart Metro bundler with `--clear` flag
3. Reload the app

### Background Removal Fails

**Possible Causes:**

- Monthly API limit reached (50 calls on free tier)
- Image format not supported
- Network connection issues
- Image too large

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
