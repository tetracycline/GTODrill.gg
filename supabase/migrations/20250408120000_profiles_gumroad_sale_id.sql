-- Gumroad webhook 可寫入最後一筆 sale_id（Edge Function 選填更新此欄）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gumroad_sale_id text;

COMMENT ON COLUMN public.profiles.gumroad_sale_id IS 'Gumroad ping 最後收到的 sale_id';
