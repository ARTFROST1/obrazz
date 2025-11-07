# New Carousel System Architecture

## Overview

Complete redesign of the carousel system with realistic physics and smooth scrolling.

## Key Features

### 1. **Full Width Design**

- Edge-to-edge carousel (no side padding)
- Items scroll across entire screen width
- Center item positioned exactly in screen center

### 2. **Realistic Physics**

- Natural inertia and momentum
- Smooth deceleration curve (like CS:GO case opening)
- Velocity-based snapping:
  - Low velocity: smooth snap to center
  - High velocity: continue with momentum, gradual deceleration

### 3. **No Empty Elements**

- Removed "None" placeholder
- Only show actual wardrobe items
- Category can be disabled via flag button

### 4. **Flag Button System**

- Overlay button on center item (top-right corner)
- Toggle category active/inactive
- Visual indicator for disabled categories

### 5. **Item Layout**

- Maintain 3:4 aspect ratio (width:height)
- Dynamic sizing based on available height
- Multiple items visible with center focus

### 6. **Infinite Loop**

- Seamless infinite scrolling
- Large duplicate buffer (64+ items)
- No edge hitting during fast scroll

## Technical Implementation

### Core Components

1. **SmoothCarousel.tsx**
   - Main carousel component
   - Handles physics and scrolling
   - Flag button overlay
   - Infinite loop logic

2. **CarouselPhysics.ts**
   - Custom physics calculations
   - Deceleration curves
   - Velocity tracking
   - Snap detection

3. **CategorySelector.tsx**
   - Container for multiple carousels
   - Manages category states
   - Full-width layout

### Physics Parameters

```typescript
const PHYSICS_CONFIG = {
  deceleration: 0.985, // Natural deceleration rate
  snapVelocityThreshold: 0.5, // Velocity below which snapping occurs
  snapAnimationDuration: 300, // Smooth snap animation (ms)
  momentumMultiplier: 1.2, // Momentum boost factor
  friction: 0.02, // Friction coefficient
};
```

### Layout Calculations

```typescript
// Full width carousel
const CAROUSEL_WIDTH = SCREEN_WIDTH;
const ITEM_ASPECT_RATIO = 3 / 4;

// Center item positioning
const CENTER_OFFSET = (SCREEN_WIDTH - itemWidth) / 2;

// Item dimensions maintain aspect ratio
const itemHeight = availableHeight - spacing * 2;
const itemWidth = itemHeight * ITEM_ASPECT_RATIO;
```

## User Experience Flow

1. **Fast Scroll**
   - User swipes quickly
   - Items scroll with momentum
   - Natural deceleration
   - No jarring stops
   - When velocity drops → smooth center snap

2. **Slow Scroll**
   - User drags slowly
   - Items follow finger precisely
   - On release with low velocity → immediate smooth snap
   - Feels responsive and controlled

3. **Category Toggle**
   - Tap flag button on center item
   - Category toggles active/inactive
   - Visual feedback immediate
   - No interruption to scroll flow

## Performance Optimizations

- Use native driver for animations
- Optimize re-renders with React.memo
- Implement getItemLayout for FlatList
- Large duplicate buffer prevents edge loading
- Lazy load images with fade-in

## Visual Design

- Clean, minimalist aesthetic
- No progress bars or extra UI
- Focus on content (items)
- Smooth transitions everywhere
- Flag button subtle but accessible
