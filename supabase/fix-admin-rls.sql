-- إصلاح سياسات RLS للمسؤولين
-- هذا الملف يضيف شرط is_admin للسماح للمستخدمين المسؤولين بتجاوز قيود RLS

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

-- حذف السياسات الحالية للمنتجات
DROP POLICY IF EXISTS "السماح للمستخدمين المجهولين بقراءة المنتجات" ON products;
DROP POLICY IF EXISTS "السماح للمشرفين بقراءة المنتجات" ON products;
DROP POLICY IF EXISTS "السماح للمشرفين بإدراج المنتجات" ON products;
DROP POLICY IF EXISTS "السماح للمشرفين بتحديث المنتجات" ON products;
DROP POLICY IF EXISTS "السماح للمشرفين بحذف المنتجات" ON products;

-- إنشاء سياسات جديدة للمنتجات
-- السماح للمستخدمين المجهولين بالقراءة فقط
CREATE POLICY "السماح للمستخدمين المجهولين بقراءة المنتجات"
ON products FOR SELECT
TO anon
USING (true);

-- السماح للمستخدمين العاديين بقراءة المنتجات
CREATE POLICY "السماح للمستخدمين المسجلين بقراءة المنتجات"
ON products FOR SELECT
TO authenticated
USING (true);

-- السماح للمسؤولين فقط بإدراج المنتجات
CREATE POLICY "السماح للمسؤولين بإدراج المنتجات"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بتحديث المنتجات
CREATE POLICY "السماح للمسؤولين بتحديث المنتجات"
ON products FOR UPDATE
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بحذف المنتجات
CREATE POLICY "السماح للمسؤولين بحذف المنتجات"
ON products FOR DELETE
TO authenticated
USING (auth.is_admin());

-- حذف السياسات الحالية للفئات
DROP POLICY IF EXISTS "السماح للمستخدمين المجهولين بقراءة الفئات" ON categories;
DROP POLICY IF EXISTS "السماح للمشرفين بقراءة الفئات" ON categories;
DROP POLICY IF EXISTS "السماح للمشرفين بإدراج الفئات" ON categories;
DROP POLICY IF EXISTS "السماح للمشرفين بتحديث الفئات" ON categories;
DROP POLICY IF EXISTS "السماح للمشرفين بحذف الفئات" ON categories;

-- إنشاء سياسات جديدة للفئات
-- السماح للمستخدمين المجهولين بالقراءة فقط
CREATE POLICY "السماح للمستخدمين المجهولين بقراءة الفئات"
ON categories FOR SELECT
TO anon
USING (true);

-- السماح للمستخدمين المسجلين بقراءة الفئات
CREATE POLICY "السماح للمستخدمين المسجلين بقراءة الفئات"
ON categories FOR SELECT
TO authenticated
USING (true);

-- السماح للمسؤولين فقط بإدراج الفئات
CREATE POLICY "السماح للمسؤولين بإدراج الفئات"
ON categories FOR INSERT
TO authenticated
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بتحديث الفئات
CREATE POLICY "السماح للمسؤولين بتحديث الفئات"
ON categories FOR UPDATE
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بحذف الفئات
CREATE POLICY "السماح للمسؤولين بحذف الفئات"
ON categories FOR DELETE
TO authenticated
USING (auth.is_admin());

-- حذف السياسات الحالية للإعدادات
DROP POLICY IF EXISTS "السماح للمستخدمين المجهولين بقراءة الإعدادات" ON app_settings;
DROP POLICY IF EXISTS "السماح للمشرفين بقراءة الإعدادات" ON app_settings;
DROP POLICY IF EXISTS "السماح للمشرفين بإدراج الإعدادات" ON app_settings;
DROP POLICY IF EXISTS "السماح للمشرفين بتحديث الإعدادات" ON app_settings;
DROP POLICY IF EXISTS "السماح للمشرفين بحذف الإعدادات" ON app_settings;

-- إنشاء سياسات جديدة للإعدادات
-- السماح للمستخدمين المجهولين بالقراءة فقط
CREATE POLICY "السماح للمستخدمين المجهولين بقراءة الإعدادات"
ON app_settings FOR SELECT
TO anon
USING (true);

-- السماح للمستخدمين المسجلين بقراءة الإعدادات
CREATE POLICY "السماح للمستخدمين المسجلين بقراءة الإعدادات"
ON app_settings FOR SELECT
TO authenticated
USING (true);

-- السماح للمسؤولين فقط بإدراج الإعدادات
CREATE POLICY "السماح للمسؤولين بإدراج الإعدادات"
ON app_settings FOR INSERT
TO authenticated
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بتحديث الإعدادات
CREATE POLICY "السماح للمسؤولين بتحديث الإعدادات"
ON app_settings FOR UPDATE
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- السماح للمسؤولين فقط بحذف الإعدادات
CREATE POLICY "السماح للمسؤولين بحذف الإعدادات"
ON app_settings FOR DELETE
TO authenticated
USING (auth.is_admin());

-- سياسات جدول orders
DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع الطلبات" ON public.orders;

-- سياسات جديدة لجدول orders
-- سياسة تتيح للمستخدمين المصادق عليهم إنشاء طلبات
CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- سياسة تتيح للمستخدمين قراءة طلباتهم فقط
CREATE POLICY "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.is_admin());

-- سياسة تتيح للمستخدمين تعديل طلباتهم فقط، وللمسؤولين تعديل جميع الطلبات
CREATE POLICY "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.is_admin());

-- سياسات جدول order_items
DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" ON public.order_items;

-- سياسات جديدة لجدول order_items
-- سياسة تتيح للمستخدمين المصادق عليهم إنشاء عناصر الطلبات
CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- سياسة تتيح للمستخدمين قراءة عناصر طلباتهم فقط أو للمسؤولين قراءة الجميع
CREATE POLICY "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR auth.is_admin())
    )
  );

-- سياسة تتيح للمستخدمين تعديل عناصر طلباتهم فقط أو للمسؤولين تعديل الجميع
CREATE POLICY "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR auth.is_admin())
    )
  ); 