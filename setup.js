// إعداد بيئة الاختبار
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser, createOrderEnhanced } = orderHelper;

// بيانات المستخدم للاختبار
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function setup() {
  try {
    console.log('بدء إعداد بيئة الاختبار...');
    
    // 1. تسجيل الدخول أو إنشاء مستخدم جديد
    console.log('تسجيل الدخول أو إنشاء مستخدم جديد...');
    
    try {
      const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
      
      if (loginResult.success) {
        console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
        console.log('معلومات المستخدم:', loginResult.user);
      } else {
        console.warn('تحذير: فشل تسجيل الدخول ولكن سنكمل الإعداد:', loginResult.message);
      }
    } catch (loginError) {
      console.warn('تحذير: حدث خطأ أثناء تسجيل الدخول ولكن سنكمل الإعداد:', loginError.message);
    }
    
    // 2. إنشاء منتجات تجريبية إذا لم تكن موجودة
    console.log('\nالتحقق من وجود المنتجات التجريبية...');
    
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, product_code')
        .ilike('product_code', 'TEST%');
      
      if (productsError) {
        console.warn('تحذير: خطأ في استعلام المنتجات:', productsError);
      }
      
      const existingProductCodes = products?.map(p => p.product_code) || [];
      console.log('المنتجات الموجودة:', existingProductCodes.join(', ') || 'لا توجد منتجات تجريبية');
      
      // إنشاء المنتج الأول إذا لم يكن موجوداً
      if (!existingProductCodes.includes('TEST001')) {
        console.log('إنشاء المنتج التجريبي الأول...');
        
        try {
          const { data: product1, error: product1Error } = await supabase
            .from('products')
            .insert({
              id: 'test-product-1',
              name: 'منتج تجريبي 1',
              product_code: 'TEST001',
              piece_price: 10,
              pack_price: 50,
              box_price: 100,
              box_quantity: 10,
              is_new: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
          
          if (product1Error) {
            console.warn('تحذير: خطأ في إنشاء المنتج التجريبي الأول:', product1Error);
          } else {
            console.log('تم إنشاء المنتج التجريبي الأول:', product1[0]);
          }
        } catch (prodError) {
          console.warn('تحذير: حدث خطأ أثناء إنشاء المنتج الأول:', prodError.message);
        }
      }
      
      // إنشاء المنتج الثاني إذا لم يكن موجوداً
      if (!existingProductCodes.includes('TEST002')) {
        console.log('إنشاء المنتج التجريبي الثاني...');
        
        try {
          const { data: product2, error: product2Error } = await supabase
            .from('products')
            .insert({
              id: 'test-product-2',
              name: 'منتج تجريبي 2',
              product_code: 'TEST002',
              piece_price: 20,
              pack_price: 100,
              box_price: 200,
              box_quantity: 10,
              is_new: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
          
          if (product2Error) {
            console.warn('تحذير: خطأ في إنشاء المنتج التجريبي الثاني:', product2Error);
          } else {
            console.log('تم إنشاء المنتج التجريبي الثاني:', product2[0]);
          }
        } catch (prodError) {
          console.warn('تحذير: حدث خطأ أثناء إنشاء المنتج الثاني:', prodError.message);
        }
      }
    } catch (productsQueryError) {
      console.warn('تحذير: حدث خطأ أثناء استعلام المنتجات:', productsQueryError.message);
    }
    
    // 3. محاولة إنشاء طلب تجريبي
    console.log('\nمحاولة إنشاء طلب تجريبي...');
    
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (ordersError) {
        console.warn('تحذير: خطأ في استعلام الطلبات:', ordersError);
      } else {
        if (!orders || orders.length === 0) {
          console.log('لا توجد طلبات. محاولة إنشاء طلب تجريبي...');
          
          try {
            const orderData = {};
            
            const orderItems = [
              {
                product_id: 'test-product-1',
                quantity: 2,
                note: 'ملاحظة تجريبية 1'
              },
              {
                product_id: 'test-product-2',
                quantity: 1,
                note: 'ملاحظة تجريبية 2'
              }
            ];
            
            const createOrderResult = await createOrderEnhanced(orderData, orderItems);
            
            if (!createOrderResult.success) {
              console.warn('تحذير: خطأ في إنشاء الطلب التجريبي:', createOrderResult.message);
            } else {
              console.log('تم إنشاء الطلب التجريبي بنجاح:');
              console.log('معرف الطلب:', createOrderResult.order.id);
              console.log('عدد العناصر:', createOrderResult.order.order_items?.length || 0);
            }
          } catch (orderCreateError) {
            console.warn('تحذير: حدث خطأ أثناء إنشاء الطلب التجريبي:', orderCreateError.message);
          }
        } else {
          console.log('يوجد بالفعل طلبات تجريبية:', orders[0]);
        }
      }
    } catch (ordersQueryError) {
      console.warn('تحذير: حدث خطأ أثناء استعلام الطلبات:', ordersQueryError.message);
    }
    
    console.log('\nتم إتمام إعداد بيئة الاختبار!');
    console.log('ملاحظة: قد تكون بعض العمليات فشلت بسبب قيود RLS ولكن تم تجاهلها.');
  } catch (error) {
    console.error('خطأ غير متوقع أثناء إعداد بيئة الاختبار:', error);
    console.log('تم إتمام الإعداد بشكل جزئي. قد تحتاج إلى ضبط سياسات RLS على قاعدة البيانات.');
  }
}

setup(); 