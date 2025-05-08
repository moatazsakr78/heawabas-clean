@echo off
echo "جاري تنفيذ سكريبت إصلاح مشكلة RLS المتعلقة بالطلبات..."
node fix-order-rls.js
echo.
echo "تم الانتهاء. اضغط أي مفتاح للإغلاق."
pause > nul 