'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // إعادة توجيه تلقائية إلى صفحة طلبات العملاء
    window.location.href = '/admin/customer-orders';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">جاري إعادة التوجيه...</h2>
        <div className="animate-spin h-8 w-8 mx-auto border-4 border-gray-500 rounded-full border-t-transparent"></div>
      </div>
    </div>
  );
} 