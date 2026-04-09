-- 讓 Gumroad Webhook 能以 email 對到使用者：回填 profiles.email，並提供 service_role 專用之查詢函式。
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (
    p.email IS NULL
    OR lower(trim(p.email)) <> lower(trim(u.email))
  );

CREATE OR REPLACE FUNCTION public.gumroad_lookup_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id
  FROM auth.users
  WHERE email IS NOT NULL
    AND lower(trim(email)) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.gumroad_lookup_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gumroad_lookup_user_id_by_email(text) TO service_role;

COMMENT ON FUNCTION public.gumroad_lookup_user_id_by_email(text) IS 'Gumroad ping：依買家 email 解析 auth.users.id，供 Edge Function 在 profiles.email 為空時仍更新訂閱';
