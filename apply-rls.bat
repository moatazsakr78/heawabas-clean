@echo off
echo "جاري تطبيق سياسات RLS على جداول الطلبات..."
node apply-rls-policies.js
echo.
echo "تم الانتهاء. اضغط أي مفتاح للإغلاق."
pause > nul 