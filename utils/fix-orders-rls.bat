@echo off
echo "جاري إصلاح سياسات RLS لجداول الطلبات..."

REM تحقق من وجود ملف node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo "خطأ: لم يتم العثور على Node.js. يرجى تثبيت Node.js أولاً."
  pause > nul
  exit /b 1
)

REM تنفيذ سكريبت إصلاح سياسات RLS
node apply-rls-policies.js

echo.
echo "تم الانتهاء من تطبيق سياسات RLS لجداول الطلبات."
echo "يمكنك أيضاً تنفيذ ملف fix-orders-rls.sql مباشرة في واجهة SQL في Supabase."
echo.

echo "اضغط أي مفتاح للإغلاق."
pause > nul 