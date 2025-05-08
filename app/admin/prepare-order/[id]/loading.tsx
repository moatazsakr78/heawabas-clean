'use client';

import { useEffect } from 'react';

export default function Loading() {
  useEffect(() => {
    // التحقق مما إذا كان المستخدم ينتقل من صفحة التحضير
    const checkNavigationAndRedirect = () => {
      try {
        // التحقق من وجود علامة في localStorage تشير إلى أن المستخدم قادم من صفحة التحضير
        const isRedirecting = localStorage.getItem('prepare_order_redirecting');
        if (isRedirecting === 'true') {
          // مسح العلامة
          localStorage.removeItem('prepare_order_redirecting');
          // إعادة التوجيه مباشرة إلى صفحة طلبات العملاء
          window.location.replace('/admin/customer-orders');
        }
      } catch (error) {
        console.error('Error during navigation check:', error);
      }
    };

    checkNavigationAndRedirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">جاري التحميل...</h2>
        <div className="animate-spin h-12 w-12 mx-auto border-4 border-[#5D1F1F] rounded-full border-t-transparent"></div>
      </div>
    </div>
  );
} 