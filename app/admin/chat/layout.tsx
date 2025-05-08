'use client';

// لا نقوم بتوفير layout مخصص لأن هذا يتسبب في مشاكل عند الانتقال بين الصفحات
// بدلاً من ذلك سنترك صفحة المحادثات تستخدم layout الافتراضي ونخفي العناصر عن طريق CSS

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>{children}</>
  );
} 