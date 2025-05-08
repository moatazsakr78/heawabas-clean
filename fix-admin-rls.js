// إصلاح سياسات RLS للمسؤولين
const orderHelper = require('./supabase-order-helper');
const { supabase, loginOrCreateUser } = orderHelper;
const fs = require('fs');
const path = require('path');

// بيانات المستخدم للاختبار (يستخدم فقط للدخول كمستخدم له صلاحيات)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';

async function fixAdminRLS() {
  try {
    console.log('=================================================');
    console.log('إصلاح سياسات RLS للمسؤولين');
    console.log('=================================================');
    
    // 1. تسجيل الدخول كمستخدم له صلاحيات (سنستخدم هذا فقط لتنفيذ الاستعلامات)
    console.log('\n1. تسجيل الدخول...');
    const loginResult = await loginOrCreateUser(TEST_EMAIL, TEST_PASSWORD);
    
    if (!loginResult.success) {
      console.error('فشل تسجيل الدخول:', loginResult.message);
      return { success: false, message: `فشل تسجيل الدخول: ${loginResult.message}` };
    }
    
    console.log('تم تسجيل الدخول بنجاح:', loginResult.message);
    
    // 2. قراءة ملف SQL
    console.log('\n2. قراءة ملف SQL لإصلاح سياسات RLS...');
    
    const sqlFilePath = path.join(__dirname, 'supabase', 'fix-admin-rls.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 3. تقسيم ملف SQL إلى استعلامات منفصلة
    console.log('\n3. تقسيم استعلامات SQL...');
    
    // نقسم الملف إلى استعلامات منفصلة باستخدام الفاصلة المنقوطة
    const sqlQueries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0)
      .map(query => query + ';');
    
    console.log(`تم العثور على ${sqlQueries.length} استعلام SQL للتنفيذ`);
    
    // 4. تنفيذ استعلامات SQL
    console.log('\n4. تنفيذ استعلامات SQL...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlQueries.length; i++) {
      const query = sqlQueries[i];
      console.log(`\nتنفيذ الاستعلام ${i+1}/${sqlQueries.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        
        if (error) {
          console.error(`خطأ في تنفيذ الاستعلام ${i+1}:`, error.message);
          errorCount++;
        } else {
          console.log(`تم تنفيذ الاستعلام ${i+1} بنجاح`);
          successCount++;
        }
      } catch (err) {
        console.error(`خطأ غير متوقع في تنفيذ الاستعلام ${i+1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n=================================================');
    console.log(`تم تنفيذ ${successCount} استعلام بنجاح`);
    console.log(`فشل تنفيذ ${errorCount} استعلام`);
    
    if (errorCount === 0) {
      console.log('\nتم إصلاح سياسات RLS للمسؤولين بنجاح!');
      return { success: true, message: 'تم إصلاح سياسات RLS للمسؤولين بنجاح' };
    } else {
      console.log('\nتم إصلاح سياسات RLS للمسؤولين بشكل جزئي، يرجى مراجعة الأخطاء أعلاه');
      return { success: true, message: 'تم إصلاح سياسات RLS للمسؤولين بشكل جزئي' };
    }
    
  } catch (error) {
    console.error('خطأ غير متوقع أثناء إصلاح سياسات RLS للمسؤولين:', error);
    return { success: false, message: `خطأ غير متوقع: ${error.message}` };
  }
}

// تنفيذ الدالة
fixAdminRLS()
  .then(result => {
    console.log('\nنتيجة إصلاح سياسات RLS للمسؤولين:', result.success ? 'نجاح' : 'فشل');
    console.log(result.message);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('خطأ غير معالج:', error);
    process.exit(1);
  }); 