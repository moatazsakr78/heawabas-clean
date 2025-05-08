'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiPackage, FiLogOut, FiMenu, FiX, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { hasData, removeData, saveData } from '@/lib/localStorage';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = () => {
      // التحقق من وجود توكن المسؤول في التخزين المحلي
      const isAuth = hasData('admin_token');
      
      // إذا لم يكن موجودًا، عرض نموذج تسجيل الدخول
      if (!isAuth) {
        setShowLogin(true);
      } else {
        setIsAuthenticated(true);
        setShowLogin(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const handleLogout = () => {
    removeData('admin_token');
    window.location.href = '/';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من بيانات المسؤول
    if (username === 'goodmorning' && password === 'shahenda') {
      // حفظ توكن المصادقة
      saveData('admin_token', 'admin_' + Date.now());
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // إعادة تحميل الصفحة الحالية
      if (pathname) {
        window.location.href = pathname;
      } else {
        window.location.href = '/admin/products';
      }
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };
  
  const navigation = [
    { name: 'إدارة المنتجات', href: '/admin/products', icon: FiPackage },
    { name: 'طلبات العملاء', href: '/admin/customer-orders', icon: FiShoppingCart },
    { name: 'المحادثات', href: '/admin/chat', icon: FiMessageCircle },
  ];

  // وظيفة التنقل المباشر باستخدام window.location
  const handleDirectNavigation = (href: string) => {
    setSidebarOpen(false);
    window.location.href = href;
  };
  
  // عرض نموذج تسجيل الدخول إذا لم يكن المستخدم مصادقًا
  if (showLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold">تسجيل دخول المسؤول</h1>
          
          {loginError && (
            <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
              {loginError}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                اسم المستخدم
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-md bg-[#5D1F1F] px-4 py-2 text-white hover:bg-[#4A1818] focus:bg-[#4A1818] focus:outline-none"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md py-4 px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">لوحة التحكم</h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      
      {/* Sidebar - Desktop always visible, Mobile conditional */}
      <div className={`
        ${sidebarOpen ? 'block' : 'hidden'} 
        md:block bg-white shadow-md w-full md:w-64 md:h-screen
        md:min-h-screen md:static absolute z-10
      `}>
        <div className="h-20 hidden md:flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-primary">لوحة التحكم</h1>
        </div>
        <nav className="mt-5">
          <ul>
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <li key={item.name} className="px-6 py-2">
                  <button
                    onClick={() => handleDirectNavigation(item.href)}
                    className={`flex items-center w-full text-right space-x-3 rtl:space-x-reverse cursor-pointer ${
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    <item.icon className="h-5 w-5 ml-2" />
                    <span>{item.name}</span>
                  </button>
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
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 