# Stage 4: Manual Outfit Creator - Testing Guide

## Quick Start

### Prerequisites

- Stage 3 completed (wardrobe with items)
- User logged in
- At least 2-3 items per category recommended for testing

### Launch Commands

```bash
npm start
# or
npx expo start --clear
```

## Feature Testing Checklist

### 1. Canvas Gestures ✅

**Test Drag:**

- [ ] Tap and drag an item - should move smoothly
- [ ] Drag item to edges - should not go off-canvas
- [ ] Drag multiple items - each moves independently

**Test Scale (Pinch):**

- [ ] Pinch to zoom out (0.5x minimum)
- [ ] Pinch to zoom in (3x maximum)
- [ ] Scale should animate smoothly with spring physics

**Test Rotate:**

- [ ] Two-finger rotate - item rotates
- [ ] Rotation should be smooth and responsive
- [ ] Check 360° rotation works

**Test Combined Gestures:**

- [ ] Pan + pinch simultaneously
- [ ] Pan + rotate simultaneously
- [ ] All three gestures together

### 2. Category Carousels ✅

**Test Item Selection:**

- [ ] Tap item in carousel - appears on canvas
- [ ] Select different item - replaces previous
- [ ] Scroll carousel - auto-scrolls to selected item
- [ ] Empty category shows placeholder

**Test Lock/Unlock:**

- [ ] Tap lock icon - changes state
- [ ] Locked icon changes color (blue)
- [ ] Unlocked icon is gray
- [ ] Lock state persists during session

### 3. Randomize Feature ✅

**Test Basic Randomization:**

- [ ] Click "Randomize" button
- [ ] Random items appear for unlocked categories
- [ ] Click again - different items appear
- [ ] Works with empty categories (skips them)

**Test Lock Behavior:**

- [ ] Lock a category with item
- [ ] Click randomize
- [ ] Locked category item doesn't change
- [ ] Other categories get new items

### 4. Background Picker ✅

**Test Interface:**

- [ ] Click palette icon - modal opens
- [ ] Modal has solid colors section
- [ ] Modal has gradients section
- [ ] "Premium" section visible (locked)
- [ ] Close button works

**Test Color Selection:**

- [ ] Select white - canvas turns white
- [ ] Select black - canvas turns black
- [ ] Select any color - updates immediately
- [ ] Selected color has blue border
- [ ] Modal closes after selection

**Test Gradient Selection:**

- [ ] Select gradient - canvas updates
- [ ] Preview matches actual result
- [ ] Selected gradient has blue border

### 5. Undo/Redo System ✅

**Test Undo:**

- [ ] Add item - undo button enabled
- [ ] Click undo - item removed
- [ ] Undo multiple times - works correctly
- [ ] At beginning - undo disabled (gray)

**Test Redo:**

- [ ] After undo - redo enabled
- [ ] Click redo - item restored
- [ ] Redo multiple times - works
- [ ] At end - redo disabled (gray)

**Test History Limit:**

- [ ] Make 25 changes
- [ ] Check only last 20 are undoable
- [ ] Performance remains smooth

**Test History Clear:**

- [ ] Make changes with history
- [ ] Click clear canvas
- [ ] History should reset

### 6. Save Outfit ✅

**Test Validation:**

- [ ] Try to save empty canvas - blocked with alert
- [ ] Add one item - save button enabled (blue)
- [ ] Click save - modal appears

**Test Save Modal:**

- [ ] Input field for title
- [ ] Cancel button works
- [ ] Save without title - uses "My Outfit"
- [ ] Save with title - uses custom name
- [ ] Shows "Saving..." state
- [ ] Success alert appears
- [ ] Canvas resets after save

**Test Error Handling:**

- [ ] Disconnect network
- [ ] Try to save - error alert appears
- [ ] Can retry after reconnect

### 7. Outfit Detail Screen ✅

**Test Navigation:**

- [ ] Tap saved outfit - detail screen opens
- [ ] Back button returns to previous screen
- [ ] Canvas displays correctly

**Test Actions:**

- [ ] Click heart - toggles favorite (changes color)
- [ ] Click edit - navigates to edit mode
- [ ] Click duplicate - creates copy with "(Copy)" suffix
- [ ] Click "I Wore This" - wear count increases
- [ ] Click delete - confirmation appears
- [ ] Confirm delete - outfit removed

**Test Display:**

- [ ] Title displays correctly
- [ ] Description shows (if any)
- [ ] Wear count visible
- [ ] Creation date formatted correctly
- [ ] Style tags display
- [ ] Season tags display

### 8. Canvas Controls ✅

**Test Clear Canvas:**

- [ ] Add multiple items
- [ ] Click trash icon
- [ ] All items removed instantly
- [ ] History includes clear action

**Test Grid Toggle (Future):**

- Currently disabled
- Will be in canvas settings

### 9. Performance Testing ✅

**Test Smooth Gestures:**

- [ ] Drag item - 60fps smooth
- [ ] Pinch zoom - no lag
- [ ] Rotate - fluid motion
- [ ] Multiple simultaneous gestures

**Test with Many Items:**

- [ ] Add items to all 7 categories
- [ ] Drag each - performance maintained
- [ ] Randomize - responds quickly
- [ ] Save - completes in <3 seconds

**Test Memory:**

- [ ] Create 10+ outfits
- [ ] App doesn't crash
- [ ] Scrolling remains smooth
- [ ] Loading persisted outfits works

### 10. Edge Cases ✅

**Test Empty States:**

- [ ] No items in wardrobe - shows empty carousels
- [ ] No outfits saved - appropriate message
- [ ] Single item category - works normally

**Test Extreme Transforms:**

- [ ] Scale to 0.5x - visible but small
- [ ] Scale to 3x - visible but large
- [ ] Rotate 720° - works correctly
- [ ] Drag far off-center - stays on canvas

**Test Rapid Actions:**

- [ ] Click randomize rapidly - handles gracefully
- [ ] Spam undo/redo - no crashes
- [ ] Quick save attempts - prevents duplicates
- [ ] Rapid item selections - last one wins

## Integration Testing

### Test Full Workflow:

1. [ ] Open Create screen
2. [ ] Select item from tops
3. [ ] Select item from bottoms
4. [ ] Select item from footwear
5. [ ] Drag tops item to top-center
6. [ ] Drag bottoms to bottom-center
7. [ ] Drag footwear to bottom
8. [ ] Scale tops up 1.5x
9. [ ] Rotate bottoms slightly
10. [ ] Change background to light blue
11. [ ] Lock tops category
12. [ ] Click randomize
13. [ ] Verify tops didn't change
14. [ ] Verify bottoms and footwear randomized
15. [ ] Click undo - returns to previous state
16. [ ] Click redo - returns to randomized state
17. [ ] Click save
18. [ ] Enter "Summer Casual" as title
19. [ ] Confirm save
20. [ ] Verify success message
21. [ ] Verify canvas cleared
22. [ ] Navigate to outfit detail
23. [ ] Verify all items and title correct

### Test Persistence:

1. [ ] Create outfit and save
2. [ ] Close app completely
3. [ ] Reopen app
4. [ ] Check outfit still exists
5. [ ] Open outfit detail - displays correctly

## Known Issues to Watch For

### TypeScript Errors (Fixed)

- ❌ ~~`@types/` import errors~~ → ✅ Fixed with relative paths

### Potential Issues

1. **FlatList scroll-to-index warning** - Safe to ignore, handled with timeout
2. **Reanimated worklet warnings** - Expected, animations work correctly
3. **Gesture conflicts** - Resolved with Gesture.Simultaneous

## Performance Benchmarks

### Expected Performance:

- **Gesture Response:** <16ms (60fps)
- **Randomize:** <200ms
- **Save Outfit:** 1-3 seconds
- **Load Detail:** <500ms
- **Undo/Redo:** <50ms

### Memory Usage:

- **Base:** ~120MB
- **With 10 outfits:** ~150MB
- **With 50+ items on canvas:** ~180MB

## Regression Testing

After any changes to Stage 4, retest:

- [ ] All gestures still work
- [ ] Undo/redo not broken
- [ ] Save/load functionality intact
- [ ] No new TypeScript errors
- [ ] Performance maintained

## Bug Reporting Template

```markdown
**Bug Title:** Brief description

**Steps to Reproduce:**

1. Step 1
2. Step 2
3. Step 3

**Expected:** What should happen

**Actual:** What actually happens

**Environment:**

- Device: iPhone 14 / Pixel 7
- OS: iOS 17 / Android 13
- Build: Development / Production

**Severity:** Critical / High / Medium / Low

**Screenshots:** If applicable
```

## Success Criteria

Stage 4 is considered complete when:

- ✅ All checklist items pass
- ✅ No critical bugs found
- ✅ Performance meets benchmarks
- ✅ TypeScript compiles without errors
- ✅ User workflow is smooth and intuitive

---

**Last Updated:** January 14, 2025  
**Tested By:** Development Team  
**Status:** Ready for Testing
