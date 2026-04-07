-- Pro 訂閱／買斷到期時間（Gumroad webhook 與後台可寫入）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'Pro 權益結束時間；NULL 表示未設定或視為無期限';
