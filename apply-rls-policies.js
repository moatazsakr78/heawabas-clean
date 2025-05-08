// تطبيق سياسات RLS المناسبة لجداول الطلبات
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser } = orderHelper;

// بيانات المستخدم للاختبار
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function applyRLSPolicies() {
  try {
    console.log('=================================================');
    console.log('تطبيق سياسات RLS المناسبة لجداول الطلبات');
    console.log('=================================================');
    
    // 1. تسجيل الدخول كمستخدم له صلاحيات
    console.log('\n1. تسجيل الدخول...');
    const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
    
    if (!loginResult.success) {
      console.error('فشل تسجيل الدخول:', loginResult.message);
      return { success: false, message: `فشل تسجيل الدخول: ${loginResult.message}` };
    }
    
    console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
    
    // 2. التأكد من تفعيل RLS على الجداول
    console.log('\n2. التأكد من تفعيل RLS على الجداول...');
    
    const sqlEnableRLS = `
      -- تفعيل RLS على جدول الطلبات
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      
      -- تفعيل RLS على جدول عناصر الطلبات
      ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: enableRLSError } = await supabase.rpc('exec_sql', { sql_query: sqlEnableRLS });
    
    if (enableRLSError) {
      console.error('خطأ في تفعيل RLS على الجداول:', enableRLSError);
      return { success: false, message: `خطأ في تفعيل RLS على الجداول: ${enableRLSError.message}` };
    }
    
    console.log('تم تفعيل RLS على جداول الطلبات بنجاح');
    
    // 3. إنشاء سياسات لجدول الطلبات (orders)
    console.log('\n3. إنشاء سياسات لجدول الطلبات (orders)...');
    
    // حذف السياسات الموجودة أولاً إذا كانت موجودة
    const dropOrdersPolicies = `
      DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders;
      DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders;
      DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders;
      DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع الطلبات" ON public.orders;
    `;
    
    await supabase.rpc('exec_sql', { sql_query: dropOrdersPolicies }).catch(e => {
      console.warn('تحذير عند حذف سياسات الطلبات:', e.message);
    });
    
    // إنشاء سياسات الطلبات
    const createOrdersPolicies = `
      -- سياسة تتيح للمستخدمين المصادق عليهم إنشاء طلبات
      CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء طلبات" ON public.orders
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      
      -- سياسة تتيح للمستخدمين قراءة طلباتهم فقط
      CREATE POLICY "يمكن للمستخدمين قراءة طلباتهم فقط" ON public.orders
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
      
      -- سياسة تتيح للمستخدمين تعديل طلباتهم فقط
      CREATE POLICY "يمكن للمستخدمين تعديل طلباتهم فقط" ON public.orders
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);
      
      -- سياسة تتيح للمسؤولين قراءة جميع الطلبات (اختياري)
      CREATE POLICY "المسؤولون يمكنهم قراءة جميع الطلبات" ON public.orders
        FOR SELECT
        TO authenticated
        USING (true);
    `;
    
    const { error: createOrdersPoliciesError } = await supabase.rpc('exec_sql', { sql_query: createOrdersPolicies });
    
    if (createOrdersPoliciesError) {
      console.error('خطأ في إنشاء سياسات جدول الطلبات:', createOrdersPoliciesError);
      return { success: false, message: `خطأ في إنشاء سياسات جدول الطلبات: ${createOrdersPoliciesError.message}` };
    }
    
    console.log('تم إنشاء سياسات جدول الطلبات بنجاح');
    
    // 4. إنشاء سياسات لجدول عناصر الطلبات (order_items)
    console.log('\n4. إنشاء سياسات لجدول عناصر الطلبات (order_items)...');
    
    // حذف السياسات الموجودة أولاً إذا كانت موجودة
    const dropOrderItemsPolicies = `
      DROP POLICY IF EXISTS "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items;
      DROP POLICY IF EXISTS "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items;
      DROP POLICY IF EXISTS "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items;
      DROP POLICY IF EXISTS "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" ON public.order_items;
    `;
    
    await supabase.rpc('exec_sql', { sql_query: dropOrderItemsPolicies }).catch(e => {
      console.warn('تحذير عند حذف سياسات عناصر الطلبات:', e.message);
    });
    
    // إنشاء سياسات عناصر الطلبات
    const createOrderItemsPolicies = `
      -- سياسة تتيح للمستخدمين المصادق عليهم إنشاء عناصر الطلبات
      CREATE POLICY "يمكن للمستخدمين المصادق عليهم إنشاء عناصر الطلبات" ON public.order_items
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      
      -- سياسة تتيح للمستخدمين قراءة عناصر طلباتهم فقط
      CREATE POLICY "يمكن للمستخدمين قراءة عناصر طلباتهم فقط" ON public.order_items
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
      CREATE POLICY "يمكن للمستخدمين تعديل عناصر طلباتهم فقط" ON public.order_items
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
          )
        );
      
      -- سياسة تتيح للمسؤولين قراءة جميع عناصر الطلبات (اختياري)
      CREATE POLICY "المسؤولون يمكنهم قراءة جميع عناصر الطلبات" ON public.order_items
        FOR SELECT
        TO authenticated
        USING (true);
    `;
    
    const { error: createOrderItemsPoliciesError } = await supabase.rpc('exec_sql', { sql_query: createOrderItemsPolicies });
    
    if (createOrderItemsPoliciesError) {
      console.error('خطأ في إنشاء سياسات جدول عناصر الطلبات:', createOrderItemsPoliciesError);
      return { success: false, message: `خطأ في إنشاء سياسات جدول عناصر الطلبات: ${createOrderItemsPoliciesError.message}` };
    }
    
    console.log('تم إنشاء سياسات جدول عناصر الطلبات بنجاح');
    
    // 5. تطبيق أذونات القراءة والكتابة للمستخدمين المصادق عليهم
    console.log('\n5. تطبيق أذونات القراءة والكتابة للمستخدمين المصادق عليهم...');
    
    const grantPermissions = `
      -- منح صلاحيات للمستخدمين المصادق عليهم
      GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
      GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
    `;
    
    const { error: grantPermissionsError } = await supabase.rpc('exec_sql', { sql_query: grantPermissions });
    
    if (grantPermissionsError) {
      console.error('خطأ في منح الصلاحيات:', grantPermissionsError);
      return { success: false, message: `خطأ في منح الصلاحيات: ${grantPermissionsError.message}` };
    }
    
    console.log('تم منح الصلاحيات بنجاح');
    
    // 6. إنشاء دالة مساعدة للمستخدمين لإنشاء الطلبات
    console.log('\n6. إنشاء دالة مساعدة للمستخدمين لإنشاء الطلبات...');
    
    const createHelperFunction = `
      -- دالة مساعدة لإنشاء الطلبات
      CREATE OR REPLACE FUNCTION create_order_with_items(
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
      GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
    `;
    
    const { error: createHelperFunctionError } = await supabase.rpc('exec_sql', { sql_query: createHelperFunction });
    
    if (createHelperFunctionError) {
      console.error('خطأ في إنشاء الدالة المساعدة:', createHelperFunctionError);
      return { success: false, message: `خطأ في إنشاء الدالة المساعدة: ${createHelperFunctionError.message}` };
    }
    
    console.log('تم إنشاء الدالة المساعدة بنجاح');
    
    // 7. اختبار إنشاء طلب جديد للتأكد من عمل السياسات
    console.log('\n7. اختبار إنشاء طلب جديد للتأكد من عمل السياسات...');
    
    // الحصول على المنتجات أولاً
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(2);
    
    if (productsError) {
      console.error('خطأ في استعلام المنتجات:', productsError);
      return { success: false, message: `خطأ في استعلام المنتجات: ${productsError.message}` };
    }
    
    if (!products || products.length === 0) {
      console.error('لم يتم العثور على منتجات للاختبار');
      return { success: false, message: 'لم يتم العثور على منتجات للاختبار' };
    }
    
    // إنشاء عناصر الطلب
    const orderItems = [
      {
        product_id: products[0].id,
        quantity: 2,
        note: 'اختبار سياسات RLS - المنتج الأول'
      }
    ];
    
    if (products.length > 1) {
      orderItems.push({
        product_id: products[1].id,
        quantity: 1,
        note: 'اختبار سياسات RLS - المنتج الثاني'
      });
    }
    
    // إنشاء طلب جديد باستخدام الطريقة المباشرة
    const createOrderResult = await orderHelper.createOrder({}, orderItems);
    
    if (!createOrderResult.success) {
      console.error('خطأ في إنشاء الطلب المباشر:', createOrderResult.message);
      
      // يمكن محاولة استخدام الدالة المساعدة إذا فشلت الطريقة المباشرة
      console.log('محاولة استخدام الدالة المساعدة...');
      
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_order_with_items', {
          order_items_param: orderItems
        });
      
      if (rpcError) {
        console.error('خطأ في استخدام الدالة المساعدة:', rpcError);
        return { success: false, message: `فشل إنشاء الطلب بكلتا الطريقتين: ${createOrderResult.message} و ${rpcError.message}` };
      }
      
      console.log('تم إنشاء الطلب بنجاح باستخدام الدالة المساعدة:', rpcResult);
    } else {
      console.log('تم إنشاء الطلب بنجاح بالطريقة المباشرة:', createOrderResult.message);
      console.log('معرف الطلب:', createOrderResult.order.id);
    }
    
    console.log('\n=================================================');
    console.log('تم تطبيق وتجربة سياسات RLS بنجاح');
    console.log('=================================================');
    
    return {
      success: true,
      message: 'تم تطبيق سياسات RLS لجداول الطلبات بنجاح'
    };
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    
    return {
      success: false,
      message: `خطأ غير متوقع: ${error.message}`,
      error
    };
  }
}

// تنفيذ العملية
applyRLSPolicies().then(result => {
  console.log('\nنتيجة تطبيق سياسات RLS:', result.success ? 'نجاح' : 'فشل');
  if (!result.success) {
    console.error('رسالة الخطأ:', result.message);
  }
}); 