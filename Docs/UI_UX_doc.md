# UI/UX Design System - Obrazz

## Design Philosophy

Obrazz следует принципам минималистичного дизайна с фокусом на визуальный контент. Интерфейс должен быть чистым, интуитивным и не отвлекать от главного — одежды и образов пользователя.

## Visual Style

- **Концепция:** Минимализм, чистые линии, много воздуха
- **Вдохновение:** Whering, Pinterest, Figma
- **Приоритет:** Визуальный контент над UI элементами

## Color Palette

### Light Theme (Default)

```
Primary Colors:
- Background: #FFFFFF
- Surface: #F8F8F8
- Card: #FFFFFF
- Primary: #000000
- Primary Variant: #333333

Secondary Colors:
- Accent: #007AFF (iOS Blue)
- Success: #34C759
- Warning: #FF9500
- Error: #FF3B30

Text Colors:
- Primary Text: #000000
- Secondary Text: #666666
- Disabled Text: #C4C4C4
- Inverse Text: #FFFFFF

Borders & Dividers:
- Border: #E5E5E5
- Divider: #F0F0F0
- Shadow: rgba(0,0,0,0.08)
```

### Dark Theme

```
Primary Colors:
- Background: #000000
- Surface: #1C1C1E
- Card: #2C2C2E
- Primary: #FFFFFF
- Primary Variant: #F2F2F7

Secondary Colors:
- Accent: #0A84FF
- Success: #30D158
- Warning: #FF9F0A
- Error: #FF453A

Text Colors:
- Primary Text: #FFFFFF
- Secondary Text: #8E8E93
- Disabled Text: #48484A
- Inverse Text: #000000

Borders & Dividers:
- Border: #38383A
- Divider: #2C2C2E
- Shadow: rgba(0,0,0,0.3)
```

## Typography

### Font Family

```
Primary Font: Inter
Fallback: System Default
Monospace: SF Mono (iOS), Roboto Mono (Android)
```

### Font Sizes & Weights

```
Display:
- Large: 34px, Bold (600)
- Medium: 28px, Bold (600)
- Small: 24px, Semibold (500)

Headline:
- H1: 22px, Bold (600)
- H2: 20px, Semibold (500)
- H3: 18px, Semibold (500)

Body:
- Large: 17px, Regular (400)
- Medium: 15px, Regular (400)
- Small: 13px, Regular (400)

Caption:
- Medium: 12px, Regular (400)
- Small: 11px, Regular (400)

Button:
- Large: 17px, Semibold (500)
- Medium: 15px, Medium (500)
- Small: 13px, Medium (500)
```

### Line Heights

- Display: 1.2
- Headlines: 1.3
- Body: 1.5
- Caption: 1.4

## Spacing System

Using 4px base unit:

```
xxs: 4px
xs: 8px
sm: 12px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
xxxl: 64px
```

## Grid System

### Mobile Grid

- Columns: 4
- Gutter: 16px
- Margin: 16px

### Tablet Grid

- Columns: 8
- Gutter: 24px
- Margin: 24px

### Item Grid (Wardrobe)

- Mobile: 2 columns
- Tablet: 3-4 columns
- Desktop: 4-6 columns
- Gap: 12px

## Component Specifications

### Buttons

#### Primary Button

```
Height: 52px
Border Radius: 26px
Background: Primary Color
Text: Button Large, Inverse Text
Padding: 16px 32px
Shadow: 0px 4px 12px rgba(0,0,0,0.08)
States:
- Default: 100% opacity
- Pressed: 90% opacity, scale(0.98)
- Disabled: 40% opacity
```

#### Secondary Button

```
Height: 52px
Border Radius: 26px
Background: Transparent
Border: 1px solid Primary Color
Text: Button Large, Primary Text
Padding: 16px 32px
```

#### Icon Button

```
Size: 44x44px
Border Radius: 22px
Background: Surface Color
Icon Size: 24px
```

#### Floating Action Button (FAB)

```
Size: 56x56px
Icon Size: 24px
Elevation: 8dp (shadow)
Border Radius: 28px (circular)
Position: Fixed, bottom-right
Margin: 16px from bottom and right
Z-index: Above all content, below modals

Screen-Specific Styling:

Одна реализация (`components/ui/FAB.tsx`) используется на разных экранах:
- **iOS 26+ (при доступном Liquid Glass):** `GlassView` из `expo-glass-effect`; цвет иконки — динамический `PlatformColor('label')`
- **iOS < 26 / Android:** fallback-версия; по умолчанию background `#000000`, icon `#FFFFFF` (можно переопределять пропсами)

Действия по экранам:
- Outfits screen: Create new outfit (navigates to /outfit/create)
- Wardrobe screen: Add new item (navigates to /add-item)

Note: Both screens now have consistent layout with FAB at bottom.
Wardrobe header на iOS 26+ может рендериться как Liquid Glass (поиск + меню) поверх UI; на iOS < 26 / Android используется классический header.

States:
- Default: 100% opacity, scale(1)
- Pressed: 95% opacity, scale(0.95)
- Hidden: When scrolling down (optional UX enhancement)
- Visible: When scrolling up or at top

Animation:
- Entrance: Scale from 0 + fade in, 250ms, decelerate curve
- Press: Scale to 0.95, 150ms
- Hide/Show: Slide down/up with fade, 200ms
```

### Cards

#### Item Card (Wardrobe)

```
Aspect Ratio: 3:4
Border Radius: 12px
Background: Card Color
Shadow: 0px 2px 8px rgba(0,0,0,0.06)
Image Padding: 8px
Hover/Press: scale(0.98), shadow increase
```

#### Outfit Card (Saved Outfits Grid)

```
Aspect Ratio: 3:4 (same as canvas)
Border Radius: 16px
Background: Card Color
Padding: 0
Shadow: 0px 4px 12px rgba(0,0,0,0.08)

Structure:
- Preview Image: Full card height, composited outfit collage
- Info Overlay (bottom): Gradient overlay for text readability
  - Title: Body Medium, Primary Text (white on dark gradient)
  - Visibility Badge: Small pill (Private/Shared/Public)
  - Like Count: If shared, show count with heart icon
- Quick Action Menu: Three-dot menu icon (top-right)

Interactions:
- Tap: Navigate to outfit detail/view screen
- Long Press: Show context menu (Edit, Duplicate, Share, Delete)
- Three-dot menu: Quick actions dropdown

States:
- Default: Shadow normal
- Pressed: scale(0.98), shadow increase
- Selected: 2px Primary Color border (multi-select mode)

Responsive:
- Mobile (portrait): 2 columns, 12px gap
- Tablet (landscape): 3-4 columns, 16px gap
```

#### Post Card (Community)

```
Width: 100%
Border Radius: 16px
Background: Card Color
Padding: 16px
Margin Bottom: 16px
Shadow: 0px 2px 8px rgba(0,0,0,0.04)

Structure:
- Header: Avatar (32px) + Username + Time
- Content: Outfit preview image
- Footer: Like button + Count + Share button
```

### Navigation

#### Tab Bar

```
Tabs: 4 (Home, Wardrobe, Outfits, Profile)
Height: 83px (49px bar + 34px safe area)
Background: Surface Color with blur
Border Top: 1px solid Border Color
Icons: 28px
Label: Caption Small
Active Indicator: 4px dot below icon

Tab Icons:
- Home: home / home-outline
- Wardrobe: shirt / shirt-outline
- Outfits: albums / albums-outline
- Profile: person / person-outline
```

#### Header

```
Height: 44px + status bar
Background: Background Color
Title: H2, Center aligned
Actions: Icon buttons (44x44px)
Back Button: Chevron left icon
```

### Forms

#### Text Input

```
Height: 52px
Border Radius: 12px
Background: Surface Color
Border: 1px solid Border Color (2px on focus)
Padding: 16px
Font: Body Large
Placeholder: Secondary Text Color

States:
- Default: Border Color
- Focus: Primary Color border
- Error: Error Color border
- Disabled: 40% opacity
```

#### Select/Picker

```
Height: 52px
Border Radius: 12px
Background: Surface Color
Border: 1px solid Border Color
Chevron Icon: Right aligned
```

#### Checkbox/Radio

```
Size: 24x24px
Border Radius: 6px (checkbox), 12px (radio)
Border: 2px solid Primary Color
Check Mark: 3px thick
```

### Modals & Sheets

#### Bottom Sheet

```
Max Height: 90% screen
Border Radius: 24px top corners
Background: Background Color
Handle: 36x4px, centered, 8px from top
Padding: 24px
Animation: Slide up with spring
```

#### Modal

```
Width: 90% (max 400px)
Border Radius: 16px
Background: Background Color
Padding: 24px
Overlay: rgba(0,0,0,0.5)
Animation: Fade + scale from 0.9
```

### Lists

#### List Item

```
Height: 60px minimum
Padding: 16px horizontal
Separator: 1px, Divider Color
Press State: Background to Surface Color
```

### Loading States

#### Skeleton

```
Background: Linear gradient animated
Border Radius: Match component
Animation: Shimmer effect, 1.5s duration
```

#### Spinner

```
Size: 24px (small), 36px (medium), 48px (large)
Color: Primary Color
Animation: Rotate 360deg, 1s, ease-in-out
```

### Canvas (Outfit Creator)

#### Canvas Area

```
Aspect Ratio: 3:4
Background: Selected background or gradient
Border: 2px dashed Border Color
Grid: Optional 3x3 guide lines
```

#### Item on Canvas

```
Initial Scale: Fit to category slot
Min Scale: 0.5x
Max Scale: 3x
Rotation: 360 degrees
Shadow: 0px 4px 8px rgba(0,0,0,0.1)
Selection Indicator: 2px Primary Color border
Handles: Corner dots for resize
```

#### Category Carousel

```
Height: 120px
Item Size: 80x80px
Gap: 12px
Selected Scale: 1.1x
Background: Surface Color with 80% opacity
Border Radius: 16px
Padding: 16px
```

## Animation Guidelines

### Timing

```
Instant: 0ms (state changes)
Fast: 150ms (micro-interactions)
Normal: 250ms (most transitions)
Slow: 350ms (complex animations)
```

### Easing Curves

```
Standard: cubic-bezier(0.4, 0, 0.2, 1)
Decelerate: cubic-bezier(0, 0, 0.2, 1)
Accelerate: cubic-bezier(0.4, 0, 1, 1)
Spring: tension: 170, friction: 26
```

### Common Animations

- **Page Transition:** Slide + fade, 250ms
- **Modal Open:** Fade overlay + scale content, 250ms
- **Button Press:** Scale 0.98, 150ms
- **List Item Appear:** Stagger fade in, 50ms delay
- **Drag & Drop:** Spring physics
- **Pull to Refresh:** Bounce effect

## Gesture Interactions

### Swipe Gestures

- **Horizontal Swipe:** Navigate carousel, delete item
- **Vertical Swipe:** Scroll, dismiss modal
- **Velocity Threshold:** 800px/s

### Pinch & Rotate

- **Pinch:** Scale items on canvas
- **Rotate:** Two-finger rotation on canvas
- **Sensitivity:** 1:1 mapping

### Long Press

- **Duration:** 500ms
- **Feedback:** Haptic + visual scale

### Drag & Drop

- **Activation:** Long press or immediate
- **Feedback:** Scale 1.05, shadow increase
- **Drop Zones:** Highlight on hover

## Responsive Design

### Breakpoints

```
Mobile: 0-599px
Tablet: 600-1023px
Desktop: 1024px+
```

### Adaptive Layouts

- **Navigation:** Bottom tabs (mobile), side rail (tablet+)
- **Grid Columns:** 2 (mobile), 3-4 (tablet), 4-6 (desktop)
- **Modals:** Full screen (mobile), centered (tablet+)
- **Font Scaling:** Respect system accessibility settings

## Accessibility

### Touch Targets

- Minimum size: 44x44px
- Spacing between targets: 8px minimum

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Icons: 3:1 minimum

### Screen Reader Support

- All interactive elements have labels
- Image alt texts for wardrobe items
- Announce state changes
- Logical focus order

### Motion Preferences

- Respect reduce motion settings
- Provide alternative transitions
- Disable auto-playing animations

## Platform-Specific Considerations

### iOS

- Use native iOS patterns where applicable
- Safe area insets for notch devices
- Haptic feedback for interactions
- Support Dynamic Type

### Android

- Material Design influences
- Back button handling
- Navigation drawer option
- Support display cutouts

## Icon Library

Using Expo Vector Icons (Ionicons as primary):

```
Common Icons:
- Home: home-outline / home
- Wardrobe: shirt-outline / shirt
- Create: add-circle-outline / add-circle
- Profile: person-outline / person
- Settings: settings-outline / settings
- Camera: camera-outline
- Gallery: images-outline
- Delete: trash-outline
- Edit: pencil-outline
- Share: share-outline
- Like: heart-outline / heart
- Filter: filter-outline
- Sort: swap-vertical-outline
- Close: close
- Check: checkmark
- Back: chevron-back
- Forward: chevron-forward
- More: ellipsis-horizontal
```

## Error States

### Empty States

```
Icon: 64px, Secondary Text Color
Title: H2, Primary Text
Message: Body Medium, Secondary Text
CTA Button: Primary Button (optional)
```

### Error Messages

```
Background: Error Color with 10% opacity
Border: 1px solid Error Color
Text: Body Medium, Error Color
Icon: 20px alert icon
Padding: 12px
Border Radius: 8px
```

### Validation Feedback

- Inline below input field
- Red text for errors
- Green checkmark for success
- Real-time validation where appropriate

## Loading & Progress

### Progress Bar

```
Height: 4px
Background: Surface Color
Progress: Primary Color
Border Radius: 2px
Animation: Smooth transition
```

### Upload Progress

```
Circular progress: 48px
Stroke Width: 3px
Background: Surface Color
Progress: Primary Color
Percentage Text: Center aligned
```

## Micro-interactions

### Like Animation

- Heart scales up to 1.3x
- Fills with red color
- Particle burst effect
- Duration: 350ms

### Add to Wardrobe

- Item flies to wardrobe icon
- Success checkmark appears
- Duration: 500ms

### Pull to Refresh

- Custom Lottie animation
- Elastic overscroll
- Haptic feedback on trigger

## Performance Considerations

### Image Optimization

- Lazy loading for off-screen images
- Progressive image loading
- Thumbnail placeholders
- WebP format where supported

### Animation Performance

- Use native driver
- Avoid layout animations during scroll
- GPU-accelerated transforms only
- 60fps target for all animations

### List Performance

- Virtualized lists for large datasets
- Item height optimization
- Minimal re-renders
- Cached components
