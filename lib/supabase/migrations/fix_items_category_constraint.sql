-- Fix items table category check constraint to match TypeScript types
-- This migration aligns the database schema with the application's ItemCategory type

-- Drop the old check constraint
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_category_check;

-- Add the new check constraint with updated category values
ALTER TABLE public.items ADD CONSTRAINT items_category_check 
CHECK (category IN (
  'headwear',      -- Головные уборы (was 'hats')
  'outerwear',     -- Верхняя одежда
  'tops',          -- Верх
  'bottoms',       -- Низ
  'footwear',      -- Обувь (was 'shoes')
  'accessories',   -- Аксессуары
  'dresses',       -- Платья
  'suits',         -- Костюмы (new)
  'bags'           -- Сумки
));

-- Note: 'jewelry' and 'other' removed as they're not in the TypeScript type
-- If you have existing data with these categories, you'll need to migrate it first
