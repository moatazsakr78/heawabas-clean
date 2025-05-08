@echo off
echo "اختبار إنشاء طلب جديد..."

REM تنفيذ سكريبت الاختبار
node test-create-order.js

echo.
echo "اضغط أي مفتاح للإغلاق."
pause > nul 