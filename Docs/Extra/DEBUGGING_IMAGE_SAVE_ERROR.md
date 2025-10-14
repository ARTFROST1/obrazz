# Debugging Guide: Image Save Error (InternalBytecode.js)

## Problem Description

You're experiencing an error when trying to save a wardrobe item after uploading a photo. The error message shows:

```
Error: ENOENT: no such file or directory, open 'E:\it\garderob\obrazz\InternalBytecode.js'
```

**Important:** This is NOT the real error! This is Metro bundler failing to display the actual error. The real problem is hidden underneath.

## What We've Done

We've added enhanced logging to help identify the exact problem. The logs will show you where the save operation fails.

## Steps to Debug

### Step 1: Clear All Caches

Stop the app and restart with a clean cache:

```bash
# Press Ctrl+C to stop the current server
# Then run:
npx expo start --clear
```

### Step 2: Reproduce the Error

1. Open the app
2. Go to Wardrobe tab
3. Tap the "+" button to add an item
4. Upload a photo (from gallery or camera)
5. **OPTIONAL:** Try removing background (skip this initially)
6. Fill in:
   - Item name (optional)
   - Category (required)
   - At least one color (required)
   - Brand, size (optional)
7. Tap "Save to Wardrobe"

### Step 3: Check Console Logs

Look carefully at your terminal/console output. You should see detailed logs like:

```
[ItemService] Starting createItem for user: <user-id>
[ItemService] Saving image locally from URI: <image-path>
[ItemService.saveImageLocally] Input URI: <uri>
[ItemService.saveImageLocally] User ID: <id>
[ItemService.saveImageLocally] Target directory: <directory>
[ItemService.saveImageLocally] Source file exists, size: <size>
...
```

**Find the LAST successful log message** - the error happens right after that point.

### Step 4: Common Issues to Check

#### Issue #1: File System Permissions (Most Likely)

The app might not have permission to write files.

**On Android:**

- Go to device Settings → Apps → Obrazz
- Check "Storage" permission is granted
- If not, enable it and try again

**On iOS:**

- Should work automatically
- Check Settings → Obrazz if any permissions are disabled

#### Issue #2: Insufficient Storage Space

Check your device has at least 100MB free space.

#### Issue #3: Image Format Issues

Try with different images:

- Take a new photo with camera (instead of gallery)
- Try a smaller image
- Try without background removal first

### Step 5: Share Debug Information

If the problem persists, please share:

1. **The full console output** (from `npx expo start --clear`)
2. **Which log line is the last one you see** (e.g., "[ItemService.saveImageLocally] Source file exists")
3. **Your device type** (Android/iOS, phone model)
4. **Available storage space** on your device
5. **Did you use "Remove BG"?** (Yes/No)

### Step 6: Workarounds to Try

While debugging, you can try:

1. **Skip background removal** - Just upload and save directly
2. **Take photo with camera** - Instead of selecting from gallery
3. **Use a smaller image** - Compress or resize before uploading
4. **Restart the app** - Close completely and reopen

## Understanding the Logs

### Good Log Sequence (Success):

```
[ItemService] Starting createItem for user: abc123
[ItemService] Saving image locally from URI: file:///...
[ItemService.saveImageLocally] Input URI: file:///...
[ItemService.saveImageLocally] Target directory: file:///...
[ItemService.saveImageLocally] Source file exists, size: 123456
[ItemService.saveImageLocally] Directory already exists
[ItemService.saveImageLocally] Copying to: file:///...
[ItemService.saveImageLocally] File copied successfully, size: 123456
[ItemService] Image saved to: file:///...
[ItemService] Generating thumbnail...
[ItemService.generateThumbnail] Input path: file:///...
[ItemService.generateThumbnail] Resizing to width: 300
[ItemService.generateThumbnail] Manipulation result URI: file:///...
[ItemService.generateThumbnail] Copying to: file:///...
[ItemService.generateThumbnail] Thumbnail created successfully, size: 45678
[ItemService] Thumbnail created at: file:///...
[ItemService] Inserting item to Supabase...
[ItemService] Item created successfully: xyz789
```

### Bad Log Sequence (Shows Error):

```
[ItemService] Starting createItem for user: abc123
[ItemService] Saving image locally from URI: file:///...
[ItemService.saveImageLocally] Input URI: file:///...
[ItemService.saveImageLocally] Target directory: file:///...
[ItemService.saveImageLocally] Error: <-- ERROR DETAILS HERE
[ItemService.saveImageLocally] Error details: { name: ..., message: ..., stack: ... }
[ItemService] Error creating item: <-- THIS IS THE REAL ERROR
```

**The REAL error will be in the logs above the InternalBytecode error!**

## Need More Help?

If you've tried all the steps above and still have issues, please provide:

1. Full console logs (copy all text from terminal)
2. Device information (phone model, OS version)
3. Screenshots of the error
4. Answer: Does it work without background removal?

## Technical Details

For developers debugging this issue:

- **Root cause:** Real JavaScript exception during file operations
- **Symptom:** Metro symbolication fails, showing InternalBytecode error
- **Files with enhanced logging:**
  - `services/wardrobe/itemService.ts`
  - `services/wardrobe/backgroundRemover.ts`
- **Most likely failures:**
  - FileSystem.copyAsync() - Permission denied
  - FileSystem.makeDirectoryAsync() - Cannot create directory
  - ImageManipulator.manipulateAsync() - Memory or format issue
  - FileSystem.writeAsStringAsync() - Write permission issue

---

**Bug Reference:** BUG-S4-005 in Bug_tracking.md  
**Date:** 2025-10-14
