-- Webhook 會寫入 `updated_at`；若建立 profiles 時未加此欄會導致 PostgREST 更新失敗（500）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
