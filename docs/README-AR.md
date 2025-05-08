# نظام إدارة الطلبات مع Supabase

## نظرة عامة

نظام إدارة الطلبات هو حل متكامل يستخدم Supabase لإدارة وتتبع الطلبات والمنتجات. يوفر النظام واجهة برمجة بسيطة للتعامل مع الطلبات بما في ذلك إنشاء الطلبات واستعراضها وتحديث حالتها.

## المميزات

- إنشاء طلبات جديدة مع عناصر متعددة
- تتبع حالة تحضير عناصر الطلب
- استعراض جميع الطلبات وتفاصيلها
- نظام مصادقة آمن مدمج مع Supabase
- دعم سياسات أمان Row Level Security (RLS)

## البدء السريع

### 1. إعداد البيئة

قم بتشغيل ملف الإعداد للتأكد من تهيئة البيئة:

```
setup.bat
```

### 2. تشغيل الاختبارات

للتأكد من عمل النظام بشكل صحيح:

```
run-tests.bat
```

### 3. تطبيق سياسات الأمان

لإضافة سياسات RLS المناسبة لقاعدة البيانات، يرجى تنفيذ ملف `rls-policy-commands.sql` في واجهة SQL في Supabase.

## استخدام واجهة برمجة التطبيقات

### إنشاء طلب جديد

```javascript
const { createOrderEnhanced } = require('./supabase-order-helper');

const orderItems = [
  {
    product_id: 'product-id-1',
    quantity: 3,
    note: 'ملاحظة خاصة بالمنتج الأول'
  },
  {
    product_id: 'product-id-2',
    quantity: 1,
    note: 'ملاحظة خاصة بالمنتج الثاني'
  }
];

// إنشاء طلب للمستخدم الحالي
const result = await createOrderEnhanced({}, orderItems);

if (result.success) {
  console.log('تم إنشاء الطلب بنجاح، معرف الطلب:', result.order.id);
} else {
  console.error('فشل إنشاء الطلب:', result.message);
}
```

### الحصول على جميع الطلبات

```javascript
const { getAllOrders } = require('./supabase-order-helper');

const result = await getAllOrders();

if (result.success) {
  console.log(`تم العثور على ${result.orders.length} طلب`);
  result.orders.forEach(order => {
    console.log(`الطلب رقم ${order.id} - عدد العناصر: ${order.order_items.length}`);
  });
} else {
  console.error('فشل استرجاع الطلبات:', result.message);
}
```

### تحديث حالة تحضير عنصر الطلب

```javascript
const { updateOrderItemPreparation } = require('./supabase-order-helper');

// تحديث حالة تحضير عنصر الطلب (orderItemId هو معرف عنصر الطلب)
const result = await updateOrderItemPreparation('order-item-id', true);

if (result.success) {
  console.log('تم تحديث حالة تحضير عنصر الطلب بنجاح');
} else {
  console.error('فشل تحديث حالة تحضير عنصر الطلب:', result.message);
}
```

## حل مشكلة RLS (تأمين الصف)

إذا واجهت مشكلة في إنشاء الطلبات مع تفعيل سياسات RLS، يرجى الرجوع إلى الملف التالي:

```
README-RLS-FIX.md
```

## الملفات الرئيسية

- `supabase-order-helper.js`: وحدة مساعدة لعمليات الطلبات
- `setup.js`: إعداد بيئة الاختبار وإنشاء البيانات الأولية
- `test-supabase-helper.js`: اختبار وظائف وحدة مساعد الطلبات
- `rls-policy-commands.sql`: أوامر SQL لتطبيق سياسات RLS
- `README-RLS-FIX.md`: دليل إصلاح مشكلة RLS

## متطلبات النظام

- Node.js (الإصدار 14 أو أحدث)
- حساب Supabase مع قاعدة بيانات نشطة
- الجداول الأساسية: `users`, `products`, `orders`, `order_items`

## ملاحظات هامة

- تأكد من تسجيل الدخول قبل إجراء عمليات على الطلبات
- لتجنب مشاكل RLS، استخدم دائماً الدالة `createOrderEnhanced` بدلاً من `createOrder`
- قم بتطبيق سياسات RLS المناسبة لضمان أمان البيانات مع سهولة الاستخدام 