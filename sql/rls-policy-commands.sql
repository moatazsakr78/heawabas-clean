-- قم بنسخ هذه الأوامر ولصقها في واجهة SQL في Supabase

-- 1. تفعيل RLS على جداول الطلبات
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات الموجودة إذا كانت موجودة (اختياري)
DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع الطلبات" ON public.orders;

DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items;
DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" ON public.order_items;

-- 3. إنشاء سياسات جدول الطلبات (orders)

-- سياسة تتيح للمستخدمين المصادق عليهم إنشاء طلبات
CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" 
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- سياسة تتيح للمستخدمين قراءة طلباتهم فقط
CREATE POLICY "يمكن للمستخدمين قراءة طلباتهم فقط" 
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- سياسة تتيح للمستخدمين تعديل طلباتهم فقط
CREATE POLICY "يمكن للمستخدمين تعديل طلباتهم فقط" 
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- سياسة تتيح للمسؤولين قراءة جميع الطلبات (اختياري - يمكنك تعليقها إذا لم تكن بحاجة إليها)
CREATE POLICY "المسؤولون يمكنهم قراءة جميع الطلبات" 
ON public.orders
FOR SELECT
TO authenticated
USING (true);

-- 4. إنشاء سياسات جدول عناصر الطلبات (order_items)

-- سياسة تتيح للمستخدمين المصادق عليهم إنشاء عناصر الطلبات
CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" 
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- سياسة تتيح للمستخدمين قراءة عناصر طلباتهم فقط
CREATE POLICY "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" 
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

-- سياسة تتيح للمستخدمين تعديل عناصر طلباتهم فقط
CREATE POLICY "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" 
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

-- سياسة تتيح للمسؤولين قراءة جميع عناصر الطلبات (اختياري - يمكنك تعليقها إذا لم تكن بحاجة إليها)
CREATE POLICY "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" 
ON public.order_items
FOR SELECT
TO authenticated
USING (true);

-- 5. منح صلاحيات للمستخدمين المصادق عليهم
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;

-- 6. إنشاء دالة مساعدة لإنشاء الطلبات (اختياري)
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  order_items_param JSONB
) RETURNS JSONB AS $$
DECLARE
  new_order_id UUID;
  item JSONB;
  result JSONB;
BEGIN
  -- إنشاء الطلب للمستخدم الحالي
  INSERT INTO orders (user_id, created_at)
  VALUES (auth.uid(), NOW())
  RETURNING id INTO new_order_id;
  
  -- إضافة عناصر الطلب
  FOR item IN SELECT * FROM jsonb_array_elements(order_items_param) LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      note,
      is_prepared,
      created_at
    )
    VALUES (
      new_order_id,
      (item->>'product_id')::TEXT,
      COALESCE((item->>'quantity')::INTEGER, 1),
      COALESCE(item->>'note', ''),
      FALSE,
      NOW()
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
GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated; 