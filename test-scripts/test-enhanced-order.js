// اختبار وظيفة إنشاء الطلبات المحسنة
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser, createOrderEnhanced } = orderHelper;

// بيانات المستخدم للاختبار
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function testEnhancedOrderCreation() {
  try {
    console.log('=================================================');
    console.log('اختبار وظيفة إنشاء الطلبات المحسنة');
    console.log('=================================================');
    
    // 1. تسجيل الدخول
    console.log('\n1. تسجيل الدخول...');
    const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
    
    if (!loginResult.success) {
      console.error('فشل تسجيل الدخول:', loginResult.message);
      return;
    }
    
    console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
    console.log('معرف المستخدم:', loginResult.user.id);
    
    // 2. الحصول على المنتجات التجريبية
    console.log('\n2. الحصول على المنتجات التجريبية...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, product_code')
      .limit(2);
    
    if (productsError) {
      console.error('خطأ في استعلام المنتجات:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.error('لم يتم العثور على منتجات للاختبار. يرجى تشغيل ملف setup.js أولاً');
      return;
    }
    
    console.log('تم العثور على المنتجات التجريبية:');
    products.forEach(product => {
      console.log(`- ${product.name} (${product.id}): ${product.product_code}`);
    });
    
    // 3. إنشاء طلب جديد باستخدام الوظيفة المحسنة
    console.log('\n3. إنشاء طلب جديد باستخدام الوظيفة المحسنة...');
    
    const orderItems = [
      {
        product_id: products[0].id,
        quantity: 3,
        note: 'اختبار الوظيفة المحسنة - المنتج الأول'
      }
    ];
    
    if (products.length > 1) {
      orderItems.push({
        product_id: products[1].id,
        quantity: 1,
        note: 'اختبار الوظيفة المحسنة - المنتج الثاني'
      });
    }
    
    // تحديد معرف المستخدم بوضوح
    const orderData = {
      user_id: loginResult.user.id
    };
    
    console.log('معلومات الطلب:', orderData);
    console.log('عناصر الطلب:', orderItems);
    
    const createOrderResult = await createOrderEnhanced(orderData, orderItems);
    
    if (!createOrderResult.success) {
      console.error('فشل إنشاء الطلب:', createOrderResult.message);
      return;
    }
    
    console.log('تم إنشاء الطلب بنجاح. معرف الطلب:', createOrderResult.order.id);
    console.log('تفاصيل الطلب:');
    console.log(JSON.stringify(createOrderResult.order, null, 2));
    
    // 4. التحقق من وجود الطلب وعناصره في قاعدة البيانات
    console.log('\n4. التحقق من وجود الطلب وعناصره في قاعدة البيانات...');
    
    // التحقق من الطلب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', createOrderResult.order.id)
      .single();
    
    if (orderError) {
      console.error('خطأ في التحقق من الطلب:', orderError);
    } else {
      console.log('تم العثور على الطلب في قاعدة البيانات:', order);
    }
    
    // التحقق من عناصر الطلب
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', createOrderResult.order.id);
    
    if (itemsError) {
      console.error('خطأ في التحقق من عناصر الطلب:', itemsError);
    } else {
      console.log(`تم العثور على ${items.length} عنصر في الطلب:`);
      items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product_id} - الكمية: ${item.quantity}`);
      });
    }
    
    console.log('\n=================================================');
    console.log('تم اكتمال الاختبار بنجاح!');
    console.log('=================================================');
  } catch (error) {
    console.error('خطأ غير متوقع أثناء الاختبار:', error);
  }
}

testEnhancedOrderCreation(); 