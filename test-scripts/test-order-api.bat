@echo off
echo "اختبار عملية إنشاء الطلب عبر API..."

REM تحقق من وجود ملف node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo "خطأ: لم يتم العثور على Node.js. يرجى تثبيت Node.js أولاً."
  pause > nul
  exit /b 1
)

REM تثبيت المكتبات المطلوبة إذا لم تكن موجودة
if not exist "node_modules/@supabase/supabase-js" (
  echo "تثبيت مكتبة Supabase..."
  npm install @supabase/supabase-js
)

REM تشغيل سكريبت الاختبار
node test-order-api.js

echo.
echo "اضغط أي مفتاح للإغلاق."
pause > nul 