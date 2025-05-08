-- إنشاء وظيفة مساعدة تتحقق من صلاحيات المسؤول
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT users.is_admin INTO is_admin
  FROM auth.users
  JOIN public.users ON auth.users.id = public.users.id
  WHERE auth.users.id = auth.uid();
  
  RETURN COALESCE(is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 