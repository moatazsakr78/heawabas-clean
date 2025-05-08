@echo off
echo "اختبار عملية إنشاء الطلب في المتصفح..."

REM تحقق من وجود ملف node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo "خطأ: لم يتم العثور على Node.js. يرجى تثبيت Node.js أولاً."
  pause > nul
  exit /b 1
)

REM تشغيل سكريبت الاختبار
node test-order-browser.js

echo.
echo "اضغط أي مفتاح للإغلاق."
pause > nul 