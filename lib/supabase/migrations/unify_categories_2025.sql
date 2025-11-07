-- Unify item categories across the application
-- This migration aligns the database schema with the unified category list:
-- головной убор, верхняя одежда, верх, низ, обувь, аксессуары, FullBody, Другое

-- Step 1: Update existing data to new category values
-- Convert 'dresses' -> 'fullbody'
UPDATE public.items 
SET category = 'fullbody' 
WHERE category = 'dresses';

-- Convert 'suits' -> 'fullbody'
UPDATE public.items 
SET category = 'fullbody' 
WHERE category = 'suits';

-- Convert 'bags' -> 'other'
UPDATE public.items 
SET category = 'other' 
WHERE category = 'bags';

-- Step 2: Drop the old check constraint
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;

-- Step 3: Add the new unified check constraint
ALTER TABLE public.items ADD CONSTRAINT items_category_check 
CHECK (category IN (
  'headwear',      -- головной убор
  'outerwear',     -- верхняя одежда
  'tops',          -- верх
  'bottoms',       -- низ
  'footwear',      -- обувь
  'accessories',   -- аксессуары
  'fullbody',      -- FullBody (платья, костюмы)
  'other'          -- Другое
));

-- Note: This migration ensures database consistency with TypeScript types
-- and provides a single source of truth for all categories
