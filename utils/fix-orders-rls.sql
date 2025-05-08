-- ملف SQL لإصلاح سياسات RLS لجداول الطلبات
-- يمكن تنفيذ هذه الأوامر مباشرة في واجهة SQL في Supabase

-- 1. تفعيل RLS على جداول الطلبات
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. حذف جميع السياسات الموجودة لإزالة التداخل والتضارب
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين حذف طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع الطلبات" ON public.orders;

DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين حذف عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" ON public.order_items;

-- 3. منح صلاحيات كاملة للمستخدمين المصادق عليهم
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. إنشاء سياسات جديدة مبسطة لجدول الطلبات (orders)

-- سياسة القراءة: يمكن للمستخدم قراءة طلباته فقط
CREATE POLICY "orders_select" 
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- سياسة الإضافة: يمكن للمستخدم إضافة طلبات لنفسه فقط
CREATE POLICY "orders_insert" 
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- سياسة التعديل: يمكن للمستخدم تعديل طلباته فقط
CREATE POLICY "orders_update" 
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- سياسة الحذف: يمكن للمستخدم حذف طلباته فقط
CREATE POLICY "orders_delete" 
ON public.orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. إنشاء سياسات جديدة مبسطة لجدول عناصر الطلبات (order_items)

-- سياسة القراءة: يمكن للمستخدم قراءة عناصر طلباته فقط
CREATE POLICY "order_items_select" 
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- سياسة الإضافة: يمكن للمستخدم إضافة عناصر لطلباته فقط
CREATE POLICY "order_items_insert" 
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- سياسة التعديل: يمكن للمستخدم تعديل عناصر طلباته فقط
CREATE POLICY "order_items_update" 
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- سياسة الحذف: يمكن للمستخدم حذف عناصر طلباته فقط
CREATE POLICY "order_items_delete" 
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- 6. إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- دالة مساعدة لإنشاء الطلبات (الاحتفاظ بها للتوافق)
CREATE OR REPLACE FUNCTION create_order_with_items(
  user_id_param UUID,
  order_items_param JSONB
) RETURNS JSONB AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  result JSONB;
BEGIN
  -- التحقق من أن المستخدم يقوم بإنشاء طلب لنفسه
  IF user_id_param <> auth.uid() THEN
    RAISE EXCEPTION 'لا يمكنك إنشاء طلب لمستخدم آخر';
  END IF;

  -- إنشاء الطلب
  INSERT INTO orders (user_id, status, created_at, updated_at)
  VALUES (user_id_param, 'pending', NOW(), NOW())
  RETURNING id INTO new_order_id;
  
  -- إضافة عناصر الطلب
  FOR item IN SELECT * FROM jsonb_array_elements(order_items_param) LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_code,
      quantity,
      unit_price,
      total_price,
      notes
    )
    VALUES (
      new_order_id,
      (item->>'product_id')::UUID,
      (item->>'product_name')::TEXT,
      (item->>'product_code')::TEXT,
      COALESCE((item->>'quantity')::INTEGER, 1),
      COALESCE((item->>'unit_price')::NUMERIC, 0),
      COALESCE((item->>'total_price')::NUMERIC, 0),
      (item->>'notes')::TEXT
    );
  END LOOP;
  
  -- إرجاع النتيجة
  SELECT jsonb_build_object(
    'success', true,
    'order_id', new_order_id
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح صلاحية استخدام الدالة للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated; 