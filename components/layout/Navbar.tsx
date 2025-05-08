'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiHome, FiKey, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiShoppingCart, FiCheckCircle, FiMessageCircle } from 'react-icons/fi';
import { MdShoppingBag, MdAdd } from 'react-icons/md';
import AdminLoginModal from '@/components/admin/AdminLoginModal';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { signOut } from '@/lib/auth';
import dynamic from 'next/dynamic';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: FiHome },
];

const UserChat = dynamic(() => import('@/components/chat/UserChat'), { ssr: false });

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const pathname = usePathname();
  const { user, profile, isLoading, isAdmin } = useAuth();
  const { orderMode, toggleOrderMode, itemsCount } = useCart();

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  // الحصول على اسم العرض للمستخدم - الأولوية لاسم المستخدم، ثم اسم المستخدم من البريد الإلكتروني
  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    
    if (user?.user_metadata?.username) {
      return user.user_metadata.username;
    }
    
    if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'المستخدم';
  };

  return (
    <nav className="bg-[#5D1F1F] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center h-20">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/El Farouk10.png"
                  alt="El Farouk Group"
                  width={180}
                  height={80}
                  className="h-20 w-auto max-h-20"
                  priority
                />
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between flex-1 mr-10">
            <div className="flex space-x-8 rtl:space-x-reverse">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'text-white border-b-2 border-white'
                        : 'text-white hover:text-gray-200 hover:border-b-2 hover:border-white'
                    }`}
                  >
                    <item.icon className="ml-2 text-white" />
                    {item.name}
                  </Link>
                );
              })}
              
              {/* زر لوحة التحكم للأدمن */}
              {isAdmin && (
                <Link 
                  href="/admin/products"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-white hover:text-gray-200 hover:border-b-2 hover:border-white"
                >
                  <FiKey className="ml-2 text-white" />
                  لوحة التحكم
                </Link>
              )}
            </div>

            {/* User Menu (Desktop) */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {!isLoading && user && !isAdmin && (
                <>
                  {/* Order Toggle Button (Circle) - مخفي للأدمن */}
                  <button
                    onClick={toggleOrderMode}
                    className={`rounded-full w-10 h-10 flex items-center justify-center shadow-md transition-colors ${
                      orderMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title={orderMode ? 'وضع الطلب مفعل' : 'تفعيل وضع الطلب'}
                  >
                    {orderMode ? <FiCheckCircle size={20} /> : <MdAdd size={24} />}
                  </button>

                  {/* My Orders Button - مخفي للأدمن */}
                  <Link
                    href="/cart"
                    className="flex items-center text-white hover:text-gray-200 relative"
                  >
                    <FiShoppingCart className="ml-1 w-5 h-5" />
                    <span>طلباتي</span>
                    {itemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {itemsCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Orders List Button - مخفي للأدمن */}
                  <Link
                    href="/profile?view=orders"
                    className="flex items-center text-white hover:text-gray-200"
                  >
                    <MdShoppingBag className="ml-1 w-5 h-5" />
                    <span>قائمة الطلبات</span>
                  </Link>
                </>
              )}

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      className="flex items-center text-white hover:text-gray-200"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <span className="ml-2">{getDisplayName()}</span>
                      <FiUser className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FiUser className="ml-2" />
                          الملف الشخصي
                        </Link>
                        
                        {/* عرض قائمة الطلبات للمستخدم العادي فقط */}
                        {!isAdmin && (
                          <Link
                            href="/profile?view=orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <MdShoppingBag className="ml-2" />
                            قائمة الطلبات
                          </Link>
                        )}
                        
                        {/* عرض لوحة التحكم للأدمن فقط */}
                        {isAdmin && (
                          <>
                            <Link
                              href="/admin/products"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <FiKey className="ml-2" />
                              لوحة التحكم
                            </Link>
                            <Link
                              href="/admin/chat"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <FiMessageCircle className="ml-2" />
                              المحادثات
                            </Link>
                          </>
                        )}
                        
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <FiLogOut className="ml-2" />
                          تسجيل الخروج
                        </button>
                      </div>
                    )}
                  </div>

              {!isLoading && !user && (
                <div className="flex space-x-4 rtl:space-x-reverse">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-white hover:text-gray-200"
                  >
                    <FiLogIn className="ml-1" />
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center text-white hover:text-gray-200"
                  >
                    <FiUserPlus className="ml-1" />
                    إنشاء حساب
                  </Link>
                </div>
              )}

              {!isLoading && user && !isAdmin && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="relative text-white hover:text-gray-200 p-2"
                  aria-label="فتح المحادثة"
                >
                  <FiMessageCircle size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button and icons */}
          <div className="md:hidden flex items-center">
            {!isLoading && user && !isAdmin && (
              <>
                {/* Order Toggle Button (Mobile) - مخفي للأدمن */}
                <button
                  onClick={toggleOrderMode}
                  className={`rounded-full w-10 h-10 flex items-center justify-center shadow-md mr-2 ${
                    orderMode ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {orderMode ? <FiCheckCircle size={20} /> : <MdAdd size={24} />}
                </button>
                {/* Cart Icon (Mobile) - مخفي للأدمن */}
                <Link
                  href="/cart"
                  className="text-white p-2 relative mr-2"
                >
                  <FiShoppingCart className="h-6 w-6" />
                  {itemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {itemsCount}
                    </span>
                  )}
                </Link>
                {/* Chat Icon (Mobile) */}
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="relative text-white hover:text-gray-200 p-2 mr-2"
                  aria-label="فتح المحادثة"
                >
                  <FiMessageCircle size={24} />
                </button>
              </>
            )}
            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <FiX className="block h-6 w-6 text-white" /> : <FiMenu className="block h-6 w-6 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-lg">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-primary/10'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="ml-2 text-primary" />
                {item.name}
              </Link>
            );
          })}
          {/* Admin Dashboard Link (Mobile) */}
          {isAdmin && (
            <>
              <Link
                href="/admin/products"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <FiKey className="ml-2 text-primary" />
                لوحة التحكم
              </Link>
              <Link
                href="/admin/chat"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <FiMessageCircle className="ml-2 text-primary" />
                المحادثات
              </Link>
            </>
          )}
          {/* تسجيل الدخول / الخروج */}
          {!user ? (
            <>
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <FiLogIn className="ml-2 text-primary" />
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <FiUserPlus className="ml-2 text-primary" />
                إنشاء حساب
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                onClick={() => setIsOpen(false)}
              >
                <FiUser className="ml-2 text-primary" />
                الملف الشخصي
              </Link>
              {/* عرض قائمة الطلبات للمستخدم العادي فقط */}
              {!isAdmin && (
                <>
                  <Link
                    href="/profile?view=orders"
                    className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <MdShoppingBag className="ml-2 text-primary" />
                    قائمة الطلبات
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
                className="w-full block px-3 py-2 rounded-md text-base font-medium flex items-center text-primary hover:bg-primary/10"
              >
                <FiLogOut className="ml-2 text-primary" />
                تسجيل الخروج
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* نافذة الدردشة */}
      {!isLoading && user && !isAdmin && (
        <UserChat showChat={showChat} onToggleChat={() => setShowChat(false)} />
      )}
    </nav>
  );
} 