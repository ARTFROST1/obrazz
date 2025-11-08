# Stage 3: Wardrobe Management - Testing Guide

## 🚀 Quick Start

To test Stage 3 features, run the application:

```bash
cd c:\Users\moroz\Desktop\AiWardrope\obrazz
npm start
```

Then press:

- `a` for Android
- `i` for iOS
- `w` for Web

---

## 📱 Testing Scenarios

### 1. First Time User Flow

**Steps:**

1. Launch app → Sign up or Sign in
2. Navigate to "Wardrobe" tab
3. Should see empty state with message
4. Tap the "+" button in header

**Expected:**

- Empty state shows wardrobe icon and helpful text
- Add button clearly visible
- Smooth navigation to add item screen

---

### 2. Add Item - Camera Flow

**Steps:**

1. Tap "+" button on wardrobe screen
2. Tap "Camera" button
3. Grant camera permissions (first time)
4. Take a photo
5. Crop/adjust image
6. Fill in required fields:
   - Select category (e.g., "Tops")
   - Select at least one color
7. Tap "Save to Wardrobe"

**Expected:**

- Permission dialog appears (iOS/Android)
- Camera opens successfully
- Image preview shows captured photo
- Validation prevents saving without category/color
- Success message appears
- Returns to wardrobe screen with new item

**Test Cases:**

- ✅ Camera permission granted
- ✅ Camera permission denied (should show alert)
- ✅ Image captured and displayed
- ✅ Save without category (should show error)
- ✅ Save without color (should show error)
- ✅ Save with all fields (should succeed)

---

### 3. Add Item - Gallery Flow

**Steps:**

1. Tap "+" button
2. Tap "Gallery" button
3. Grant photo library permissions
4. Select an image
5. Complete item details
6. Save

**Expected:**

- Permission dialog appears
- Gallery opens
- Selected image previews
- Can remove and re-select image
- Item saves successfully

---

### 4. Background Removal (Optional)

**Prerequisite:** Configure `EXPO_PUBLIC_REMOVE_BG_API_KEY` in `.env`

**Steps:**

1. Add item with camera or gallery
2. Tap "Remove BG" button
3. Wait for processing

**Expected:**

- Button shows loading indicator
- Background removed successfully
- Or shows error if API key not configured
- Image updates in preview

**Note:** This feature is optional and requires API key.

---

### 5. Search Functionality

**Steps:**

1. Add 3+ items to wardrobe
2. Tap search bar at top
3. Type item name or brand
4. Search updates in real-time

**Expected:**

- Results filter as you type
- Empty results show "No items match your filters"
- Clear button (X) appears when typing
- Clearing search shows all items

**Test Cases:**

- Search by item name
- Search by brand
- Search with no results
- Clear search

---

### 6. Filter System

**Steps:**

1. Add items with different categories/colors
2. Tap "Filter" button
3. Select filter criteria:
   - Categories (multiple)
   - Colors (multiple)
   - Styles (multiple)
   - Seasons (multiple)
   - Favorites only (toggle)
4. Tap "Apply Filters"

**Expected:**

- Modal opens with all filter options
- Can select multiple options
- Filter button shows active state (black background)
- "Clear All" button appears when filters active
- Item count updates
- Grid shows only matching items

**Test Cases:**

- ✅ Filter by single category
- ✅ Filter by multiple categories
- ✅ Filter by color
- ✅ Combine multiple filters
- ✅ Favorites only filter
- ✅ Clear all filters
- ✅ Filter with search combined

---

### 7. Favorites

**Steps:**

1. Tap heart icon on item card
2. Heart should fill and turn red
3. Tap "Filter" → Enable "Favorites only"
4. Should show only favorited items

**Expected:**

- Heart icon toggles on/off
- Color changes (red when favorited)
- Filter shows only favorites
- Favorite status persists after app restart

---

### 8. Item Details

**Steps:**

1. Tap on any item card
2. Item detail screen opens
3. View all metadata
4. Tap heart in header to favorite
5. Scroll to see all information
6. Tap back button

**Expected:**

- Full-screen image view
- All metadata displayed (category, brand, size, colors, styles, seasons)
- Statistics shown (times worn, date added)
- Favorite toggle works
- Back navigation works

---

### 9. Delete Item

**Steps:**

1. Open item details
2. Scroll to bottom
3. Tap "Delete Item" button
4. Confirm deletion in alert

**Expected:**

- Confirmation alert appears
- "Cancel" dismisses alert
- "Delete" removes item
- Success message shows
- Returns to wardrobe screen
- Item no longer in grid
- Item count updates

---

### 10. Pull to Refresh

**Steps:**

1. On wardrobe screen
2. Pull down from top
3. Release

**Expected:**

- Loading indicator appears
- Items refresh from database
- Indicator disappears when complete

---

### 11. Empty States

**Test different empty states:**

**A. No Items:**

- New user
- Message: "Add your first item to get started!"

**B. No Search Results:**

- Search for non-existent item
- Message: "No items match your filters"

**C. No Filtered Results:**

- Apply filters that match nothing
- Message: "No items match your filters"

---

### 12. Performance Test

**Steps:**

1. Add 50+ items (use gallery)
2. Scroll through grid
3. Apply filters
4. Search items

**Expected:**

- Smooth scrolling (60fps)
- No lag when filtering
- Search is responsive
- Images load progressively
- Memory usage stays reasonable

---

### 13. Offline Behavior

**Steps:**

1. Add items while online
2. Turn off internet connection
3. Browse wardrobe
4. Try to add new item

**Expected:**

- Existing items still visible (cached locally)
- Images load from local storage
- Adding new item shows error (requires connection)
- Helpful error messages

---

### 14. Persistence Test

**Steps:**

1. Add items
2. Set filters
3. Favorite some items
4. Close app completely
5. Reopen app

**Expected:**

- Items still in wardrobe
- Filters reset (by design)
- Favorites persisted
- Images still cached

---

## 🐛 Common Issues & Solutions

### Issue: Camera won't open

**Solution:** Check permissions in device settings

### Issue: Images not saving

**Solution:** Check file system permissions and Supabase connection

### Issue: Background removal fails

**Solution:** Verify `EXPO_PUBLIC_REMOVE_BG_API_KEY` is set in `.env`

### Issue: Items not appearing

**Solution:** Check network connection and Supabase configuration

### Issue: TypeScript warnings

**Solution:** These are cosmetic and don't affect functionality

---

## 📊 Test Coverage Checklist

### Core Functionality

- [ ] Add item via camera
- [ ] Add item via gallery
- [ ] View wardrobe grid
- [ ] View item details
- [ ] Delete item
- [ ] Favorite/unfavorite
- [ ] Search items
- [ ] Filter items
- [ ] Clear filters

### UI/UX

- [ ] Empty states display correctly
- [ ] Loading indicators show
- [ ] Error messages are clear
- [ ] Buttons provide feedback
- [ ] Navigation works smoothly
- [ ] Images load properly
- [ ] Grid layout responsive

### Data Persistence

- [ ] Items saved to database
- [ ] Images cached locally
- [ ] Favorites persist
- [ ] Store state persists

### Edge Cases

- [ ] No internet connection
- [ ] Permission denied
- [ ] Invalid image format
- [ ] Very large image
- [ ] 100+ items in wardrobe
- [ ] Special characters in names
- [ ] Empty search query

### Performance

- [ ] Smooth scrolling with many items
- [ ] Quick filter response
- [ ] Fast search updates
- [ ] Efficient image loading
- [ ] No memory leaks

---

## 📸 Screenshots Needed

For documentation, capture:

1. Empty wardrobe state
2. Add item screen with image
3. Wardrobe grid with items
4. Search in action
5. Filter modal
6. Item detail view
7. Delete confirmation

---

## ✅ Sign-off Checklist

Before marking Stage 3 complete:

- [ ] All 14 test scenarios pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] UI matches design system
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] TypeScript strict mode passing
- [ ] No console errors

---

## 🚀 Ready for Stage 4

Once all tests pass, you're ready to begin Stage 4: Manual Outfit Creator!

**Next features:**

- Drag & drop outfit creation
- Category carousels
- Canvas transformations
- Background selection
- Outfit saving

---

**Testing Status:** Ready for User Testing ✅
