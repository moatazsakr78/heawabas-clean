'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiPackage, FiLogOut, FiMenu, FiX, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    // التحقق من حالة المصادقة وصلاحيات المشرف
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [isLoading, user, isAdmin, router]);
  
  const handleLogout = async () => {
    // تسجيل الخروج وإعادة التوجيه إلى الصفحة الرئيسية
    router.push('/');
  };
  
  const navigation = [
    { name: 'إدارة المنتجات', href: '/admin/products', icon: FiPackage },
    { name: 'طلبات العملاء', href: '/admin/customer-orders', icon: FiShoppingCart },
    { name: 'المحادثات', href: '/admin/chat', icon: FiMessageCircle },
  ];
  
  if (isLoading || (!user || !isAdmin)) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
      {/* رأس الصفحة للجوال */}
      <div className="md:hidden bg-white shadow-md py-4 px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#5D1F1F]">لوحة التحكم</h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      
      {/* الشريط الجانبي */}
      <div className={`
        ${sidebarOpen ? 'block' : 'hidden'} 
        md:block bg-white shadow-md w-full md:w-64 md:h-screen
        md:min-h-screen md:static absolute z-10
      `}>
        <div className="h-20 hidden md:flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-[#5D1F1F]">لوحة التحكم</h1>
        </div>
        
        <nav className="py-6">
          <ul>
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.name} className="px-6 py-2">
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 rtl:space-x-reverse ${
                      isActive
                        ? 'text-[#5D1F1F] font-medium'
                        : 'text-gray-600 hover:text-[#5D1F1F]'
                    }`}
                  >
                    <item.icon className="h-5 w-5 ml-2" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
            <li className="px-6 py-2 mt-10">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 rtl:space-x-reverse text-[#5D1F1F] hover:text-[#300000]"
              >
                <FiLogOut size={18} className="ml-2" />
                <span>تسجيل الخروج</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 