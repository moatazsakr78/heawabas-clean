-- ملف SQL لإصلاح سياسات RLS لجدول المنتجات
-- يمكن تنفيذ هذه الأوامر مباشرة في واجهة SQL في Supabase

-- 1. إلغاء تفعيل RLS على جدول المنتجات مؤقتاً
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات الموجودة
DROP POLICY IF EXISTS "السماح للمستخدمين المجهولين بقراءة المنتجات" ON public.products;
DROP POLICY IF EXISTS "السماح للمشرفين بقراءة المنتجات" ON public.products;
DROP POLICY IF EXISTS "السماح للمشرفين بإدراج المنتجات" ON public.products;
DROP POLICY IF EXISTS "السماح للمشرفين بتحديث المنتجات" ON public.products;
DROP POLICY IF EXISTS "السماح للمشرفين بحذف المنتجات" ON public.products;

-- 3. إعادة تفعيل RLS مع إضافة السياسات المناسبة
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. إضافة سياسات القراءة للجميع
CREATE POLICY "السماح للجميع بقراءة المنتجات"
ON public.products
FOR SELECT
TO public
USING (true);

-- 5. إضافة سياسات للمستخدمين المسجلين للتحكم الكامل
CREATE POLICY "السماح للمستخدمين المسجلين بإدراج المنتجات"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "السماح للمستخدمين المسجلين بتحديث المنتجات"
ON public.products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "السماح للمستخدمين المسجلين بحذف المنتجات"
ON public.products
FOR DELETE
TO authenticated
USING (true);

-- 6. منح صلاحيات للمستخدمين المسجلين وغير المسجلين
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- 7. التأكد من عمل السياسات
-- حاول الآن إضافة منتج جديد وتأكد من أنه يعمل بشكل صحيح 