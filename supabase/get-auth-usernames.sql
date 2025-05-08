-- دالة للحصول على معلومات المستخدمين مباشرة من جدول auth.users
-- تسمح هذه الدالة للتطبيق بالوصول إلى بيانات المستخدم باستخدام كائن وسيط

CREATE OR REPLACE FUNCTION get_auth_users_info(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT
) SECURITY DEFINER
LANGUAGE SQL AS $$
  SELECT 
    id, 
    email, 
    raw_user_meta_data->>'username' as username,
    raw_user_meta_data->>'full_name' as full_name
  FROM auth.users
  WHERE id = ANY(user_ids);
$$;

-- منح صلاحيات للوصول إلى الدالة
GRANT EXECUTE ON FUNCTION get_auth_users_info(UUID[]) TO anon, authenticated;

-- أنشئ مفتاح RLS للتأكد من أن الصلاحيات تعمل بشكل صحيح
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- توفير صلاحية القراءة المباشرة للجدول للمستخدمين المجهولين
GRANT SELECT ON TABLE auth.users TO anon, authenticated; 