// اختبار عملية إنشاء الطلب ومراقبة السجلات في المتصفح
const { chromium } = require('@playwright/test');

// عنوان الموقع المراد اختباره
const APP_URL = 'http://localhost:3000'; // تأكد من تغييره حسب رابط تطبيقك

// بيانات اختبار تسجيل الدخول
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function testOrderCreation() {
  console.log('=== بدء اختبار إنشاء الطلب مع مراقبة السجلات ===');
  
  // إنشاء متصفح ونافذة جديدة
  const browser = await chromium.launch({ 
    headless: false, // لرؤية الخطوات بشكل مرئي
    slowMo: 100 // إبطاء العمليات للمشاهدة
  });
  
  const context = await browser.newContext();
  
  // تفعيل تسجيل النشاط في وحدة التحكم
  context.on('console', msg => {
    console.log(`[المتصفح] ${msg.type()}: ${msg.text()}`);
  });
  
  // تسجيل الأخطاء
  context.on('pageerror', error => {
    console.error(`[خطأ في الصفحة]: ${error.message}`);
  });
  
  // فتح صفحة جديدة
  const page = await context.newPage();
  
  try {
    // 1. الانتقال إلى الموقع
    console.log('\n1. الانتقال إلى الموقع...');
    await page.goto(APP_URL);
    console.log('تم فتح الموقع بنجاح');
    
    // 2. تسجيل الدخول
    console.log('\n2. محاولة تسجيل الدخول...');
    
    // انقر على زر تسجيل الدخول (قد تحتاج لتعديل المحددات حسب تطبيقك)
    await page.click('button:has-text("تسجيل الدخول")');
    
    // انتظار ظهور نموذج تسجيل الدخول
    await page.waitForSelector('input[type="email"]');
    
    // ملء نموذج تسجيل الدخول
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // إرسال النموذج
    await page.click('button[type="submit"]');
    
    // التحقق من نجاح تسجيل الدخول
    await page.waitForSelector('text=Welcome'); // تعديل حسب تطبيقك
    console.log('تم تسجيل الدخول بنجاح');
    
    // 3. الانتقال إلى صفحة المنتجات (تعديل حسب تطبيقك)
    console.log('\n3. الانتقال إلى صفحة المنتجات...');
    await page.click('a:has-text("المنتجات")');
    
    // 4. إضافة منتجات إلى السلة
    console.log('\n4. إضافة منتجات إلى السلة...');
    
    // إضافة المنتج الأول
    await page.click('.product-card:first-child button:has-text("إضافة إلى السلة")');
    
    // إضافة المنتج الثاني
    await page.click('.product-card:nth-child(2) button:has-text("إضافة إلى السلة")');
    
    console.log('تمت إضافة المنتجات إلى السلة');
    
    // 5. الانتقال إلى صفحة السلة
    console.log('\n5. الانتقال إلى صفحة السلة...');
    await page.click('a:has-text("السلة")');
    
    // 6. إرسال الطلب
    console.log('\n6. إرسال الطلب...');
    
    // تنفيذ سكريبت للاستماع إلى طلبات الشبكة المتعلقة بـ Supabase
    await page.evaluate(() => {
      // تخزين طلبات الشبكة المتعلقة بـ supabase
      window.supabaseRequests = [];
      
      // التقاط طلبات الشبكة المتعلقة بـ supabase
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('supabase')) {
          console.log(`[طلب شبكة]: ${url}`);
          const request = originalFetch.apply(this, args);
          request.then(response => {
            response.clone().text().then(body => {
              try {
                const data = JSON.parse(body);
                console.log(`[استجابة supabase]: `, data);
                window.supabaseRequests.push({ url, response: data });
              } catch (e) {
                console.log(`[استجابة supabase]: `, body);
              }
            });
          });
          return request;
        }
        return originalFetch.apply(this, args);
      };
    });
    
    // النقر على زر إرسال الطلب
    await page.click('button:has-text("إرسال الطلب")');
    
    // انتظار وقت كافٍ لإكمال الطلب
    await page.waitForTimeout(3000);
    
    // جمع السجلات من المتصفح
    const supbaseResults = await page.evaluate(() => {
      return window.supabaseRequests || [];
    });
    
    // طباعة نتائج طلبات Supabase
    console.log('\n=== نتائج طلبات Supabase ===');
    if (supbaseResults.length > 0) {
      supbaseResults.forEach((req, index) => {
        console.log(`طلب ${index + 1}:`, req.url);
        console.log('الاستجابة:', JSON.stringify(req.response, null, 2));
      });
    } else {
      console.log('لم يتم العثور على طلبات supabase مسجلة');
    }
    
    // 7. التحقق من إكمال الطلب
    console.log('\n7. التحقق من إكمال الطلب...');
    
    // انتظار رسالة نجاح أو تأكيد
    try {
      await page.waitForSelector('text=تم إنشاء الطلب بنجاح', { timeout: 5000 });
      console.log('تم إكمال الطلب بنجاح!');
    } catch (e) {
      console.log('لم يتم العثور على رسالة تأكيد نجاح الطلب');
    }
    
    // أخذ لقطة شاشة للنتيجة النهائية
    await page.screenshot({ path: 'test-order-result.png' });
    console.log('\nتم حفظ لقطة شاشة للنتيجة في test-order-result.png');
    
  } catch (error) {
    console.error('\n!!! حدث خطأ أثناء الاختبار !!!');
    console.error(error);
    
    // أخذ لقطة شاشة في حالة الخطأ
    await page.screenshot({ path: 'test-order-error.png' });
    console.log('تم حفظ لقطة شاشة للخطأ في test-order-error.png');
  } finally {
    // إغلاق المتصفح
    console.log('\nإغلاق المتصفح...');
    await browser.close();
    
    console.log('\n=== انتهى اختبار إنشاء الطلب ===');
  }
}

// تنفيذ الاختبار
testOrderCreation().catch(error => {
  console.error('خطأ غير متوقع:', error);
  process.exit(1);
}); 