-- Migration: Create hidden_default_items table
-- This table tracks which default items each user has hidden from their wardrobe

-- Create the hidden_default_items table
CREATE TABLE IF NOT EXISTS public.hidden_default_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  hidden_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.hidden_default_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own hidden items"
  ON public.hidden_default_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can hide default items"
  ON public.hidden_default_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide default items"
  ON public.hidden_default_items FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_hidden_default_items_user_id ON public.hidden_default_items(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_default_items_item_id ON public.hidden_default_items(item_id);

-- Comment
COMMENT ON TABLE public.hidden_default_items IS 'Tracks which default/builtin items each user has hidden from their wardrobe view';
