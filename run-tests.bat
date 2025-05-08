@echo off
echo اختبار نظام إدارة الطلبات باستخدام Supabase

echo.
echo === تشغيل تهيئة بيئة الاختبار ===
echo يجري إنشاء المستخدم والمنتجات اللازمة للاختبار...
node setup.js

echo.
echo === اختبار وحدة مساعد الطلبات ===
echo يجري اختبار وظائف إدارة الطلبات...
node test-supabase-helper.js

echo.
echo تم الانتهاء من الاختبارات
pause 