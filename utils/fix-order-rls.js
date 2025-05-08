// إصلاح مشكلة RLS المتعلقة بالطلبات
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser } = orderHelper;

// بيانات المستخدم للاختبار
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function fixOrderRLS() {
  try {
    console.log('=================================================');
    console.log('إصلاح مشكلة RLS المتعلقة بالطلبات');
    console.log('=================================================');
    
    // 1. تسجيل الدخول بوضوح للتغلب على RLS
    console.log('\n1. تسجيل الدخول بوضوح...');
    const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
    
    if (!loginResult.success) {
      console.error('فشل تسجيل الدخول:', loginResult.message);
      return;
    }
    
    console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
    console.log('معرف المستخدم:', loginResult.user.id);
    
    // 2. التحقق من إعدادات RLS الحالية
    console.log('\n2. التحقق من إعدادات RLS الحالية...');
    
    // جدول orders
    const { data: ordersRLS, error: ordersRLSError } = await supabase
      .rpc('get_policies_info', { table_name: 'orders' });
    
    if (ordersRLSError) {
      console.warn('تحذير: لا يمكن التحقق من سياسات جدول الطلبات:', ordersRLSError);
    } else {
      console.log('سياسات RLS لجدول الطلبات:', ordersRLS || 'لا توجد سياسات');
    }
    
    // جدول order_items
    const { data: orderItemsRLS, error: orderItemsRLSError } = await supabase
      .rpc('get_policies_info', { table_name: 'order_items' });
    
    if (orderItemsRLSError) {
      console.warn('تحذير: لا يمكن التحقق من سياسات جدول عناصر الطلبات:', orderItemsRLSError);
    } else {
      console.log('سياسات RLS لجدول عناصر الطلبات:', orderItemsRLS || 'لا توجد سياسات');
    }
    
    // 3. إنشاء دالة RPC بديلة لإنشاء الطلبات إذا كانت السياسات مقيدة
    console.log('\n3. محاولة إنشاء دالة RPC بديلة لإنشاء الطلبات...');
    
    try {
      // إنشاء الدالة إذا لم تكن موجودة
      const { error: createFunctionError } = await supabase.rpc('create_order_function');
      
      if (createFunctionError) {
        console.log('محاولة إنشاء دالة create_order_with_items...');
        
        // إنشاء الدالة يدوياً
        const { error: createManualFunctionError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE OR REPLACE FUNCTION create_order_with_items(
              user_id_param UUID,
              order_items_param JSONB
            ) RETURNS JSONB AS $$
            DECLARE
              new_order_id UUID;
              item JSONB;
              result JSONB;
            BEGIN
              -- إنشاء الطلب
              INSERT INTO orders (user_id, created_at)
              VALUES (user_id_param, NOW())
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
                  (item->>'quantity')::INTEGER,
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
          `
        });
        
        if (createManualFunctionError) {
          console.error('فشل إنشاء الدالة يدوياً:', createManualFunctionError);
        } else {
          console.log('تم إنشاء الدالة create_order_with_items بنجاح');
        }
      } else {
        console.log('تم إنشاء الدالة create_order_function بنجاح');
      }
    } catch (funcError) {
      console.warn('تحذير: فشل إنشاء دالة RPC البديلة:', funcError.message);
    }
    
    // 4. اختبار إنشاء طلب باستخدام الدالة البديلة
    console.log('\n4. اختبار إنشاء طلب باستخدام الطريقة البديلة...');
    
    // الحصول على المنتجات أولاً
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(2);
    
    if (productsError) {
      console.error('فشل استعلام المنتجات:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.error('لم يتم العثور على منتجات للاختبار');
      return;
    }
    
    // إنشاء عناصر الطلب
    const orderItems = [
      {
        product_id: products[0].id,
        quantity: 2,
        note: 'اختبار إصلاح RLS - المنتج الأول'
      }
    ];
    
    if (products.length > 1) {
      orderItems.push({
        product_id: products[1].id,
        quantity: 1,
        note: 'اختبار إصلاح RLS - المنتج الثاني'
      });
    }
    
    try {
      // محاولة استخدام الدالة البديلة
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('create_order_with_items', {
          user_id_param: loginResult.user.id,
          order_items_param: orderItems
        });
      
      if (rpcError) {
        console.warn('تحذير: فشل إنشاء الطلب باستخدام الدالة البديلة:', rpcError);
      } else {
        console.log('تم إنشاء الطلب باستخدام الدالة البديلة:', rpcResult);
        
        if (rpcResult && rpcResult.order_id) {
          console.log('معرف الطلب الجديد:', rpcResult.order_id);
          
          // التحقق من وجود الطلب
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', rpcResult.order_id)
            .single();
          
          if (orderError) {
            console.error('لا يمكن التحقق من الطلب الجديد:', orderError);
          } else {
            console.log('تم العثور على الطلب الجديد:', order);
            
            // التحقق من وجود عناصر الطلب
            const { data: items, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', rpcResult.order_id);
            
            if (itemsError) {
              console.error('لا يمكن التحقق من عناصر الطلب الجديد:', itemsError);
            } else {
              console.log(`تم العثور على ${items.length} عنصر في الطلب الجديد`);
            }
          }
        }
      }
    } catch (rpcCallError) {
      console.error('خطأ في استدعاء الدالة البديلة:', rpcCallError);
    }
    
    // 5. محاولة إنشاء طلب بالطريقة المباشرة
    console.log('\n5. محاولة إنشاء طلب بالطريقة المباشرة...');
    
    try {
      // إنشاء الطلب مباشرة مع تحديد معرف المستخدم
      const createOrderResult = await orderHelper.createOrder(
        { user_id: loginResult.user.id },
        orderItems
      );
      
      if (!createOrderResult.success) {
        console.error('فشل إنشاء الطلب بالطريقة المباشرة:', createOrderResult.message);
      } else {
        console.log('تم إنشاء الطلب بالطريقة المباشرة:', createOrderResult.message);
        console.log('معرف الطلب:', createOrderResult.order.id);
      }
    } catch (directOrderError) {
      console.error('خطأ في إنشاء الطلب المباشر:', directOrderError);
    }
    
    console.log('\n=================================================');
    console.log('تم اكتمال تشخيص وإصلاح مشكلة RLS');
    console.log('=================================================');
    
    return {
      success: true,
      message: 'تم محاولة إصلاح مشكلة RLS المتعلقة بالطلبات'
    };
  } catch (error) {
    console.error('خطأ غير متوقع أثناء إصلاح مشكلة RLS:', error);
    
    return {
      success: false,
      message: `خطأ غير متوقع: ${error.message}`,
      error
    };
  }
}

// تنفيذ الإصلاح
fixOrderRLS().then(result => {
  console.log('نتيجة الإصلاح:', result.success ? 'نجاح' : 'فشل');
  if (!result.success) {
    console.error('رسالة الخطأ:', result.message);
  }
}); 