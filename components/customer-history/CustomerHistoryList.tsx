'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { FiUser, FiSearch, FiCalendar, FiClock, FiChevronDown } from 'react-icons/fi';
import CustomerOrdersHistory from './CustomerOrdersHistory';
import { supabase } from '@/lib/supabase';
import { format, subDays, subMonths, subWeeks, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  productCode: string;
  piecePrice: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: string;
  notes?: string;
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    username?: string;
    user_metadata?: {
      username?: string;
      full_name?: string;
    };
    raw_user_meta_data?: {
      username?: string;
      full_name?: string;
      email?: string;
    };
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

// نطاقات التواريخ
const DATE_RANGES = {
  TODAY: 'اليوم',
  WEEK: 'الأسبوع',
  MONTH: 'الشهر',
  YEAR: 'السنة',
  ALL: 'الكل',
  CUSTOM: 'مخصص'
};

interface CustomerHistoryListProps {
  isStandalonePage?: boolean;
}

export default function CustomerHistoryList({ isStandalonePage = false }: CustomerHistoryListProps) {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>(DATE_RANGES.ALL);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const pathname = usePathname();
  
  const containerRef = useRef<HTMLDivElement>(null);
  let hideTimeout: NodeJS.Timeout | null = null;
  
  // Check if we're on the standalone page
  const isStandalone = isStandalonePage || pathname === '/admin/customer-history';
  
  // تحميل بيانات العملاء وطلباتهم المكتملة
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadCompletedOrders();
  }, [user, isAdmin]);

  // الاستماع إلى أحداث تغيير نطاق التاريخ المخصص
  useEffect(() => {
    // معالج حدث تحديث نطاق التاريخ
    const handleDateRangeChange = (event: Event) => {
      if (!selectedCustomer) return;
      
      // تحويل Event إلى CustomEvent
      const customEvent = event as CustomEvent;
      
      // الحصول على بيانات النطاق الزمني من الحدث
      if (customEvent.detail) {
        const { from, to } = customEvent.detail;
        setDateRange({ from, to });
      }
    };
    
    // إضافة مستمع الأحداث
    document.addEventListener('dateRangeChanged', handleDateRangeChange);
    
    // إزالة مستمع الأحداث عند تفكيك المكون
    return () => {
      document.removeEventListener('dateRangeChanged', handleDateRangeChange);
    };
  }, [selectedCustomer]);
  
  // تصفية العملاء حسب البحث
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // تحميل الطلبات المكتملة من قاعدة البيانات
  const loadCompletedOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب الطلبات المكتملة فقط
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        throw ordersError;
      }
      
      if (!ordersData || ordersData.length === 0) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      // جلب عناصر الطلبات
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');
      
      if (itemsError) {
        throw itemsError;
      }

      // جلب معلومات المستخدمين
      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      
      // محاولة استخدام الدالة الجديدة لجلب معلومات المستخدمين
      let authUsers: any[] = [];
      try {
        const { data: userInfo, error: userInfoError } = await supabase.rpc('get_auth_users_info', {
          user_ids: userIds
        });
        
        if (!userInfoError && userInfo) {
          console.log('تم جلب بيانات المستخدمين باستخدام get_auth_users_info:', userInfo);
          authUsers = userInfo;
        } else {
          console.error('خطأ في جلب بيانات المستخدمين باستخدام get_auth_users_info:', userInfoError);
          
          // محاولة الوصول المباشر عبر SQL
          const { data: directUsers, error: directError } = await supabase.rpc('execute_sql', {
            sql_query: `SELECT id, email, raw_user_meta_data->>'username' as username FROM auth.users WHERE id IN ('${userIds.join("','")}');`
          });
          
          if (!directError && directUsers) {
            console.log('تم جلب بيانات المستخدمين مباشرة عبر SQL:', directUsers);
            authUsers = directUsers;
          } else {
            console.error('خطأ في الوصول المباشر للمستخدمين عبر SQL:', directError);
            
            // محاولة استخدام RPC السابقة كخيار أخير
            const { data: usersData } = await supabase.rpc('get_auth_usernames', {
              user_ids: userIds
            });
            
            if (usersData) {
              console.log('تم جلب بيانات المستخدمين باستخدام RPC القديمة:', usersData);
              authUsers = usersData;
            }
          }
        }
      } catch (authError) {
        console.error('استثناء أثناء محاولة جلب بيانات المستخدمين:', authError);
      }
      
      // بديل: الحصول على المعلومات من جدول profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      // تنظيم المستخدمين حسب المعرف
      const usersById: Record<string, any> = {};
      
      // دمج البيانات من كلا المصدرين
      userIds.forEach(userId => {
        // البحث في بيانات المستخدمين
        const authUser = authUsers?.find(u => u.id === userId);
        // البحث في بيانات الملفات الشخصية
        const profileData = profilesData?.find(p => p.id === userId);
        
        // طباعة بيانات المستخدم للتصحيح
        console.log(`معلومات المستخدم ${userId}:`, { 
          authUser: authUser || 'غير موجود', 
          profileData: profileData || 'غير موجود' 
        });
        
        usersById[userId] = {
          id: userId,
          username: authUser?.username || profileData?.username || '',
          email: authUser?.email || profileData?.email || '',
          full_name: authUser?.full_name || profileData?.full_name || '',
          raw_user_meta_data: authUser?.raw_user_meta_data || null
        };
      });

      // ربط الطلبات بعناصرها
      const ordersWithItems = ordersData.map(order => {
        const items = orderItemsData
          ? orderItemsData.filter(item => item.order_id === order.id)
          : [];
        
        const user = usersById[order.user_id];
        
        return {
          ...order,
          items,
          user: {
            id: order.user_id,
            email: user?.email || '',
            username: user?.username || '',
            raw_user_meta_data: user?.raw_user_meta_data || null
          }
        };
      });

      // تجميع الطلبات حسب العميل
      const customerMap: Record<string, Customer> = {};
      
      ordersWithItems.forEach(order => {
        const userId = order.user_id;
        const user = usersById[userId];
        
        if (!customerMap[userId]) {
          const displayName = getUserDisplayName(order);
          console.log(`اسم العرض للمستخدم ${userId}:`, displayName);
          
          customerMap[userId] = {
            id: userId,
            name: displayName,
            email: user?.email || '',
            orders: [],
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: ''
          };
        }
        
        customerMap[userId].orders.push(order);
        customerMap[userId].totalOrders += 1;
        customerMap[userId].totalSpent += order.total_amount || 0;
        
        // تحديث تاريخ آخر طلب
        const orderDate = new Date(order.created_at);
        if (!customerMap[userId].lastOrderDate || orderDate > new Date(customerMap[userId].lastOrderDate)) {
          customerMap[userId].lastOrderDate = order.created_at;
        }
      });

      // تحويل الخريطة إلى مصفوفة وترتيبها حسب تاريخ آخر طلب تنازليًا
      const sortedCustomers = Object.values(customerMap).sort((a, b) => 
        new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
      );
      
      setCustomers(sortedCustomers);
    } catch (error) {
      console.error('Error loading completed orders:', error);
      setError('حدث خطأ أثناء تحميل سجل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // الحصول على اسم المستخدم للعرض
  const getUserDisplayName = (order: Order) => {
    // طباعة جميع بيانات المستخدم المتاحة للتصحيح
    console.log('بيانات المستخدم للعرض:', order.user_id, {
      username: order.user?.username,
      full_name: order.user?.full_name,
      email: order.user?.email,
      raw_meta: order.user?.raw_user_meta_data
    });
    
    // ترتيب الأولوية: الاسم الكامل ثم اسم المستخدم
    
    // أولاً: استخدام الاسم الكامل مباشرة
    if (order.user?.full_name && order.user.full_name.trim() !== '') {
      return order.user.full_name;
    }
    
    // ثانياً: استخدام اسم المستخدم مباشرة
    if (order.user?.username && order.user.username.trim() !== '') {
      return order.user.username;
    }
    
    // يمكن أن نحصل على مزيد من المعلومات في raw_user_meta_data
    // ثالثاً: التحقق من وجود بيانات meta
    const rawMeta = order.user?.raw_user_meta_data;
    if (rawMeta) {
      // إذا كان نص، نحاول تحليله
      if (typeof rawMeta === 'string') {
        try {
          const parsed = JSON.parse(rawMeta);
          if (parsed.full_name && parsed.full_name.trim() !== '') return parsed.full_name;
          if (parsed.username && parsed.username.trim() !== '') return parsed.username;
        } catch (e) {
          console.warn('خطأ في تحليل raw_user_meta_data:', e);
        }
      } 
      // إذا كان كائن
      else if (typeof rawMeta === 'object' && rawMeta !== null) {
        if (rawMeta.full_name && rawMeta.full_name.trim() !== '') {
          return rawMeta.full_name;
        }
        if (rawMeta.username && rawMeta.username.trim() !== '') {
          return rawMeta.username;
        }
      }
    }
    
    // رابعاً: استخدام البريد الإلكتروني كخيار بديل (بدون @domain.com)
    if (order.user?.email && order.user.email.trim() !== '') {
      return order.user.email.split('@')[0];
    }
    
    // استخدام اسم افتراضي مع معرف العميل
    return `عميل ${order.user_id?.substring(0, 8) || 'غير معروف'}`;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      });
    }
  };
  
  // تحديد نطاق تاريخ مسبق التحديد
  const handlePredefinedDateRange = (range: string) => {
    if (!selectedCustomer) return;
    
    setSelectedDateRange(range);
    
    // إذا كان النطاق مخصصًا، نعتمد على المكون الفرعي للتعامل معه
    if (range === 'custom') {
      return;
    }
    
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = now;
    
    switch (range) {
      case DATE_RANGES.TODAY:
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case DATE_RANGES.WEEK:
        from = startOfWeek(now, { weekStartsOn: 6 }); // اعتبار السبت بداية الأسبوع
        to = endOfWeek(now, { weekStartsOn: 6 });
        break;
      case DATE_RANGES.MONTH:
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case DATE_RANGES.YEAR:
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case DATE_RANGES.ALL:
        from = null;
        to = null;
        break;
    }
    
    setDateRange({ from, to });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // إعادة تعيين نطاق التاريخ إلى الكل
    setSelectedDateRange(DATE_RANGES.ALL);
    setDateRange({ from: null, to: null });
  };
  
  // عند إغلاق تفاصيل العميل
  const handleHistoryClosed = () => {
    setSelectedCustomer(null);
  };
  
  // منطق إظهار/إخفاء الـ scrollbar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const showScrollbar = () => {
      container.classList.add('show-scrollbar');
      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        container.classList.remove('show-scrollbar');
      }, 2000);
    };

    container.addEventListener('scroll', showScrollbar);
    container.addEventListener('mouseenter', showScrollbar);

    return () => {
      container.removeEventListener('scroll', showScrollbar);
      container.removeEventListener('mouseenter', showScrollbar);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, []);
  
  // إخفاء الشريط الجانبي عند تحميل المكون
  useEffect(() => {
    if (isStandalone) {
      // إذا كنا في وضع الصفحة المستقلة، نخفي العناصر الأخرى
      const sidebarElements = document.querySelectorAll('.md\\:block.bg-white.shadow-md.w-full.md\\:w-64, .md\\:hidden.bg-white.shadow-md');
      sidebarElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
      
      // تغيير نمط المحتوى الرئيسي
      const mainContent = document.querySelector('.flex-1.overflow-auto');
      if (mainContent instanceof HTMLElement) {
        mainContent.style.padding = '0';
        mainContent.style.overflow = 'hidden';
      }
    }
    
    return () => {
      // إعادة إظهار العناصر عند إزالة المكون
      if (isStandalone) {
        const sidebarElements = document.querySelectorAll('.md\\:block.bg-white.shadow-md.w-full.md\\:w-64, .md\\:hidden.bg-white.shadow-md');
        sidebarElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.display = '';
          }
        });
        
        // إعادة نمط المحتوى الرئيسي
        const mainContent = document.querySelector('.flex-1.overflow-auto');
        if (mainContent instanceof HTMLElement) {
          mainContent.style.padding = '';
          mainContent.style.overflow = '';
        }
      }
    };
  }, [isStandalone]);

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* قائمة العملاء */}
      <div className={`w-full sm:w-80 md:w-96 h-full border-l overflow-hidden flex flex-col ${selectedCustomer && 'hidden sm:flex'}`}>
        <div className="p-4 border-b flex flex-col">
          <h2 className="text-xl font-bold mb-2 text-center">سجل الطلبات المكتملة</h2>
          
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن عميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto h-full custom-scrollbar"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2">جاري التحميل...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-500">
              <p>{error}</p>
              <Button onClick={loadCompletedOrders} className="mt-2">إعادة المحاولة</Button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد عملاء لديهم طلبات مكتملة'}
            </div>
          ) : (
            <div>
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedCustomer?.id === customer.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ml-3 flex-shrink-0">
                      <FiUser size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.name}</div>
                      <div className="text-sm text-gray-500 truncate">{customer.email || 'بدون بريد'}</div>
                    </div>
                    <div className="text-xs text-gray-500 flex flex-col items-end">
                      <span>{formatDate(customer.lastOrderDate)}</span>
                      <Badge variant="outline" className="mt-1 text-xs bg-green-50 text-green-700">
                        {customer.totalOrders} طلب
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <FiClock className="inline-block ml-1" size={14} />
                      آخر طلب: {formatDate(customer.lastOrderDate)}
                    </span>
                    <span className="font-medium">{customer.totalSpent.toFixed(2)} جنيه</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* عرض تفاصيل سجل طلبات العميل */}
      {selectedCustomer ? (
        <CustomerOrdersHistory 
          customer={selectedCustomer}
          dateRange={dateRange}
          onClose={handleHistoryClosed}
          onFilterChange={handlePredefinedDateRange}
          selectedDateRange={selectedDateRange}
          dateRanges={DATE_RANGES}
        />
      ) : (
        <div className="hidden sm:flex flex-col items-center justify-center flex-1 bg-gray-50 p-4">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <FiUser size={48} className="mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">اختر عميلًا لعرض سجل طلباته</h3>
            <p className="text-gray-500">
              قم باختيار عميل من القائمة لعرض سجل طلباته المكتملة وتفاصيلها
            </p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          background-color: transparent;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .custom-scrollbar.show-scrollbar::-webkit-scrollbar,
        .custom-scrollbar:hover::-webkit-scrollbar {
          opacity: 1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
      `}</style>
    </div>
  );
} 