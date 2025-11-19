-- Migration: Insert default wardrobe items
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from Supabase
-- You can find your user_id in Supabase Dashboard > Authentication > Users

-- Set your user_id here (the owner of default items)
-- Example: DO $$ DECLARE default_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; $$ ...

DO $$
DECLARE
  default_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS!
BEGIN
  -- Delete existing default items (optional - uncomment if you want to reset)
  -- DELETE FROM public.items WHERE is_default = true;

  -- Insert default items
  INSERT INTO public.items (user_id, name, category, color, style, season, tags, favorite, is_default, image_url, thumbnail_url, metadata)
  VALUES
    -- 1. Футболка чёрная
    (default_user_id, 'Футболка чёрная', 'tops', '#000000',
     ARRAY['casual']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_1_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_1_2025-11-20_00-15-55.png',
     '{"brand": "Nike", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 2. Iphone
    (default_user_id, 'Iphone', 'accessories', '#0000FF',
     ARRAY['formal', 'casual', 'sporty', 'elegant']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_10_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_10_2025-11-20_00-15-55.png',
     '{"brand": "Apple", "colors": [{"hex": "#0000FF", "name": "Blue"}], "primaryColor": {"hex": "#0000FF", "name": "Blue"}}'::jsonb),

    -- 3. Кроссовки (Adidas)
    (default_user_id, 'Кроссовки', 'footwear', '#000000',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['fall', 'winter', 'spring', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_11_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_11_2025-11-20_00-15-55.png',
     '{"brand": "Adidas", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 4. Браслет
    (default_user_id, 'Браслет', 'accessories', '#C0C0C0',
     ARRAY['casual', 'elegant']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_12_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_12_2025-11-20_00-15-55.png',
     '{"brand": "Nomination", "colors": [{"hex": "#C0C0C0", "name": "Silver"}], "primaryColor": {"hex": "#C0C0C0", "name": "Silver"}}'::jsonb),

    -- 5. Ремень (первый)
    (default_user_id, 'Ремень', 'accessories', '#2F2F2F',
     ARRAY['formal', 'casual']::text[],
     ARRAY['spring', 'fall', 'winter', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_13_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_13_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#2F2F2F", "name": "Black"}], "primaryColor": {"hex": "#2F2F2F", "name": "Black"}}'::jsonb),

    -- 6. Шарф
    (default_user_id, 'Шарф', 'accessories', '#F5F5DC',
     ARRAY['casual', 'formal']::text[],
     ARRAY['fall', 'winter', 'spring']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_14_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_14_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#F5F5DC", "name": "Beige"}], "primaryColor": {"hex": "#F5F5DC", "name": "Beige"}}'::jsonb),

    -- 7. Бомбер
    (default_user_id, 'Бомбер', 'outerwear', '#000000',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_16_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_16_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 8. Худи
    (default_user_id, 'Худи', 'outerwear', '#A52A2A',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_17_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_17_2025-11-20_00-15-55.png',
     '{"brand": "GAP", "colors": [{"hex": "#A52A2A", "name": "Brown"}], "primaryColor": {"hex": "#A52A2A", "name": "Brown"}}'::jsonb),

    -- 9. Пиджак
    (default_user_id, 'Пиджак', 'outerwear', '#000000',
     ARRAY['casual', 'formal']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_18_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_18_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 10. Кожанная куртка
    (default_user_id, 'Кожанная куртка', 'outerwear', '#000000',
     ARRAY['casual']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_19_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_19_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 11. Брюки
    (default_user_id, 'Брюки', 'bottoms', '#000000',
     ARRAY['casual', 'formal']::text[],
     ARRAY['spring', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_2_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_2_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 12. Шапка
    (default_user_id, 'Шапка', 'headwear', '#FFFFFF',
     ARRAY['formal', 'casual']::text[],
     ARRAY['fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_20_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_20_2025-11-20_00-15-55.png',
     '{"brand": "The North Face", "colors": [{"hex": "#FFFFFF", "name": "White"}], "primaryColor": {"hex": "#FFFFFF", "name": "White"}}'::jsonb),

    -- 13. Кофта
    (default_user_id, 'Кофта', 'tops', '#A52A2A',
     ARRAY['casual', 'elegant', 'formal']::text[],
     ARRAY['fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_20_2025-11-20_00-15-551.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_20_2025-11-20_00-15-551.png',
     '{"brand": "", "colors": [{"hex": "#A52A2A", "name": "Brown"}], "primaryColor": {"hex": "#A52A2A", "name": "Brown"}}'::jsonb),

    -- 14. Кеды
    (default_user_id, 'Кеды', 'footwear', '#000000',
     ARRAY['casual', 'formal', 'elegant']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_21_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_21_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 15. Дублёнка
    (default_user_id, 'Дублёнка', 'outerwear', '#000000',
     ARRAY['formal', 'casual', 'elegant']::text[],
     ARRAY['fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_22_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_22_2025-11-20_00-15-55.png',
     '{"brand": "Zara", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 16. Тренч
    (default_user_id, 'Тренч', 'outerwear', '#FFFFFF',
     ARRAY['casual', 'formal', 'elegant']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_23_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_23_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#FFFFFF", "name": "White"}], "primaryColor": {"hex": "#FFFFFF", "name": "White"}}'::jsonb),

    -- 17. Сумка (Coach)
    (default_user_id, 'Сумка', 'accessories', '#000000',
     ARRAY['casual', 'formal']::text[],
     ARRAY['spring', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_24_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_24_2025-11-20_00-15-55.png',
     '{"brand": "Coach", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 18. Лонгслив
    (default_user_id, 'Лонгслив', 'tops', '#000000',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['spring', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_3_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_3_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 19. Джинсы Багги
    (default_user_id, 'Джинсы Багги', 'bottoms', '#0000FF',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['fall', 'winter', 'spring', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_4_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_4_2025-11-20_00-15-55.png',
     '{"brand": "", "colors": [{"hex": "#0000FF", "name": "Blue"}], "primaryColor": {"hex": "#0000FF", "name": "Blue"}}'::jsonb),

    -- 20. Кроссовки (New Balance)
    (default_user_id, 'Кроссовки', 'footwear', '#FFFFFF',
     ARRAY['casual', 'sporty']::text[],
     ARRAY['spring', 'summer', 'fall']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_5_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_5_2025-11-20_00-15-55.png',
     '{"brand": "New Balance", "colors": [{"hex": "#FFFFFF", "name": "White"}], "primaryColor": {"hex": "#FFFFFF", "name": "White"}}'::jsonb),

    -- 21. Кроссовки (Nike)
    (default_user_id, 'Кроссовки', 'footwear', '#FFFFFF',
     ARRAY['casual', 'formal', 'elegant']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_6_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_6_2025-11-20_00-15-55.png',
     '{"brand": "Nike", "colors": [{"hex": "#FFFFFF", "name": "White"}], "primaryColor": {"hex": "#FFFFFF", "name": "White"}}'::jsonb),

    -- 22. Сумка (YSL)
    (default_user_id, 'Сумка', 'accessories', '#000000',
     ARRAY['formal', 'casual']::text[],
     ARRAY['spring', 'summer', 'fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_7_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_7_2025-11-20_00-15-55.png',
     '{"brand": "Yves Saint Laurent", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 23. Ремень (Diesel)
    (default_user_id, 'Ремень', 'accessories', '#000000',
     ARRAY['casual', 'formal']::text[],
     ARRAY['fall', 'winter']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_8_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_8_2025-11-20_00-15-55.png',
     '{"brand": "Diesel", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb),

    -- 24. Часы
    (default_user_id, 'Часы', 'accessories', '#000000',
     ARRAY['casual']::text[],
     ARRAY['spring', 'summer']::text[],
     ARRAY[]::text[], false, true,
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_9_2025-11-20_00-15-55.png',
     'https://oyyzncjezesrdxxowdrx.supabase.co/storage/v1/object/public/default-items/photo_9_2025-11-20_00-15-55.png',
     '{"brand": "Apple", "colors": [{"hex": "#000000", "name": "Black"}], "primaryColor": {"hex": "#000000", "name": "Black"}}'::jsonb);

  RAISE NOTICE 'Successfully inserted 24 default items';
END $$;
