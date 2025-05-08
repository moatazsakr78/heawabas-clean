@echo off
echo "جاري إصلاح سياسات RLS لجدول المنتجات..."
node fix-products-rls.js
echo.
echo "تم الانتهاء. اضغط أي مفتاح للإغلاق."
pause > nul 