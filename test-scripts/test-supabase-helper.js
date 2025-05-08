// اختبار وحدة مساعد الطلبات باستخدام Supabase
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser } = orderHelper;

// بيانات المستخدم للاختبار
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function runTests() {
  try {
    console.log('=================================================');
    console.log('اختبار وحدة مساعد الطلبات باستخدام Supabase');
    console.log('=================================================');
    
    // 1. تسجيل الدخول للتغلب على RLS
    console.log('\n1. تسجيل الدخول...');
    const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
    
    if (!loginResult.success) {
      console.error('فشل تسجيل الدخول:', loginResult.message);
      return;
    }
    
    console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
    
    // 2. التحقق من الاتصال والإحصائيات
    console.log('\n2. التحقق من اتصال Supabase...');
    const connectionResult = await orderHelper.testSupabaseConnection();
    
    if (!connectionResult.success) {
      console.error('فشل اختبار الاتصال:', connectionResult.message);
      return;
    }
    
    console.log('تم الاتصال بـ Supabase بنجاح');
    console.log('إحصائيات قاعدة البيانات:', connectionResult.stats);
    
    // 3. الحصول على المنتجات التجريبية
    console.log('\n3. الحصول على المنتجات التجريبية...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, product_code')
      .ilike('product_code', 'TEST%')
      .limit(2);
    
    if (productsError) {
      console.error('خطأ في استعلام المنتجات:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.error('لم يتم العثور على منتجات تجريبية. يرجى تشغيل ملف setup.js أولاً');
      return;
    }
    
    console.log('تم العثور على المنتجات التجريبية:');
    products.forEach(product => {
      console.log(`- ${product.name} (${product.id}): ${product.product_code}`);
    });
    
    // 4. إنشاء طلب جديد
    console.log('\n4. إنشاء طلب جديد...');
    
    const orderItems = [
      {
        product_id: products[0].id,
        quantity: 3,
        note: 'اختبار إنشاء طلب جديد - المنتج الأول'
      }
    ];
    
    if (products.length > 1) {
      orderItems.push({
        product_id: products[1].id,
        quantity: 1,
        note: 'اختبار إنشاء طلب جديد - المنتج الثاني'
      });
    }
    
    const createOrderResult = await orderHelper.createOrder({}, orderItems);
    
    if (!createOrderResult.success) {
      console.error('فشل إنشاء الطلب:', createOrderResult.message);
      return;
    }
    
    const newOrderId = createOrderResult.order.id;
    console.log('تم إنشاء الطلب بنجاح. معرف الطلب:', newOrderId);
    console.log('تفاصيل الطلب:');
    console.log(JSON.stringify(createOrderResult.order, null, 2));
    
    // 5. الحصول على تفاصيل الطلب
    console.log('\n5. الحصول على تفاصيل الطلب...');
    const orderDetailsResult = await orderHelper.getOrderDetails(newOrderId);
    
    if (!orderDetailsResult.success) {
      console.error('فشل الحصول على تفاصيل الطلب:', orderDetailsResult.message);
      return;
    }
    
    console.log('تم الحصول على تفاصيل الطلب بنجاح:');
    console.log(JSON.stringify(orderDetailsResult.order, null, 2));
    
    // 6. تحديث حالة تحضير عنصر الطلب
    if (createOrderResult.order.order_items && createOrderResult.order.order_items.length > 0) {
      console.log('\n6. تحديث حالة تحضير عنصر الطلب...');
      
      const orderItemId = createOrderResult.order.order_items[0].id;
      const updateItemResult = await orderHelper.updateOrderItemPreparation(orderItemId, true);
      
      if (!updateItemResult.success) {
        console.error('فشل تحديث حالة تحضير عنصر الطلب:', updateItemResult.message);
      } else {
        console.log('تم تحديث حالة تحضير عنصر الطلب بنجاح:');
        console.log(JSON.stringify(updateItemResult.orderItem, null, 2));
      }
    }
    
    // 7. الحصول على جميع الطلبات
    console.log('\n7. الحصول على جميع الطلبات...');
    const allOrdersResult = await orderHelper.getAllOrders();
    
    if (!allOrdersResult.success) {
      console.error('فشل الحصول على جميع الطلبات:', allOrdersResult.message);
      return;
    }
    
    console.log(`تم العثور على ${allOrdersResult.orders.length} طلب`);
    
    if (allOrdersResult.orders.length > 0) {
      console.log('أحدث 3 طلبات:');
      allOrdersResult.orders.slice(0, 3).forEach((order, index) => {
        console.log(`${index + 1}. الطلب رقم ${order.id} (${order.order_items?.length || 0} عناصر)`);
      });
    }
    
    console.log('\n=================================================');
    console.log('تم إكمال الاختبارات بنجاح!');
    console.log('=================================================');
  } catch (error) {
    console.error('خطأ غير متوقع أثناء الاختبار:', error);
  }
}

runTests(); 