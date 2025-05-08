'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  FiArrowRight, 
  FiCalendar, 
  FiChevronUp, 
  FiChevronDown, 
  FiFilter, 
  FiSearch,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { format, isValid, parse } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator'; 

interface Product {
  id: string;
  name: string;
  productCode: string;
  piecePrice: number;
  imageUrl?: string;
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
  product?: Product;
}

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  total_amount: number;
  status: string;
  notes?: string;
  items: OrderItem[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
}

interface CustomerOrdersHistoryProps {
  customer: Customer;
  dateRange: { from: Date | null; to: Date | null };
  onClose: () => void;
  onFilterChange: (range: string) => void;
  selectedDateRange: string;
  dateRanges: Record<string, string>;
}

export default function CustomerOrdersHistory({
  customer,
  dateRange,
  onClose,
  onFilterChange,
  selectedDateRange,
  dateRanges
}: CustomerOrdersHistoryProps) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });

  // تصفية الطلبات حسب نطاق التاريخ
  const filteredOrders = useMemo(() => {
    if (!dateRange.from && !dateRange.to) {
      return customer.orders;
    }
    
    return customer.orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      if (dateRange.from && dateRange.to) {
        return orderDate >= dateRange.from && orderDate <= dateRange.to;
      }
      
      if (dateRange.from && !dateRange.to) {
        return orderDate >= dateRange.from;
      }
      
      if (!dateRange.from && dateRange.to) {
        return orderDate <= dateRange.to;
      }
      
      return true;
    });
  }, [customer.orders, dateRange]);

  // حساب إجماليات الطلبات المفلترة
  const filteredTotals = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalSpent = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    return { totalOrders, totalSpent };
  }, [filteredOrders]);

  // تنسيق التاريخ بشكل مفصل
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy - hh:mm a', { locale: ar });
  };

  // توسيع/طي تفاصيل الطلب
  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // تطبيق التصفية المخصصة
  const applyCustomDateFilter = () => {
    // إذا تم تحديد نطاق زمني مخصص، نطبقه
    if (customDateRange.from || customDateRange.to) {
      // إنشاء نسخة من كائن نطاق التاريخ المخصص
      const newRange = { ...customDateRange };
      
      // ضبط وقت نهاية اليوم لتاريخ "إلى" للشمولية
      if (newRange.to) {
        const endOfDay = new Date(newRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        newRange.to = endOfDay;
      }
      
      // تحديث نطاق التاريخ
      setCustomDateRange(newRange);
      
      // تحديث مؤشر النطاق المحدد
      onFilterChange('custom');
    }
    
    // إغلاق منتقي التاريخ المخصص بعد التطبيق
    setIsCustomDateOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* رأس الصفحة */}
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <div className="flex items-center">
          <button 
            onClick={onClose}
            className="p-2 ml-2 rounded-full hover:bg-gray-100 transition-colors md:hidden"
          >
            <FiArrowRight size={20} />
          </button>
          <h2 className="text-lg font-bold">{customer.name}</h2>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {filteredTotals.totalOrders} طلب مكتمل
        </Badge>
      </div>
      
      {/* معلومات العميل وفلاتر */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600">البريد الإلكتروني:</div>
            <div className="font-medium">{customer.email || 'غير متوفر'}</div>
          </div>
          <div className="text-left rtl:text-right">
            <div className="text-sm text-gray-600">إجمالي المشتريات:</div>
            <div className="font-medium">{filteredTotals.totalSpent.toFixed(2)} جنيه</div>
          </div>
        </div>
        
        {/* فلاتر التاريخ */}
        <div>
          <div className="text-sm font-medium mb-2">تصفية حسب الفترة الزمنية</div>
          
          {/* أزرار النطاقات الزمنية المحددة مسبقاً */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <Button 
              variant={selectedDateRange === dateRanges.TODAY ? "default" : "outline"} 
              size="sm" 
              onClick={() => onFilterChange(dateRanges.TODAY)}
              className="text-xs sm:text-sm"
            >
              {dateRanges.TODAY}
            </Button>
            <Button 
              variant={selectedDateRange === dateRanges.WEEK ? "default" : "outline"} 
              size="sm" 
              onClick={() => onFilterChange(dateRanges.WEEK)}
              className="text-xs sm:text-sm"
            >
              {dateRanges.WEEK}
            </Button>
            <Button 
              variant={selectedDateRange === dateRanges.MONTH ? "default" : "outline"} 
              size="sm" 
              onClick={() => onFilterChange(dateRanges.MONTH)}
              className="text-xs sm:text-sm"
            >
              {dateRanges.MONTH}
            </Button>
            <Button 
              variant={selectedDateRange === dateRanges.YEAR ? "default" : "outline"} 
              size="sm" 
              onClick={() => onFilterChange(dateRanges.YEAR)}
              className="text-xs sm:text-sm"
            >
              {dateRanges.YEAR}
            </Button>
            <Button 
              variant={selectedDateRange === dateRanges.ALL ? "default" : "outline"} 
              size="sm" 
              onClick={() => onFilterChange(dateRanges.ALL)}
              className="text-xs sm:text-sm"
            >
              {dateRanges.ALL}
            </Button>
            <Button 
              variant={selectedDateRange === 'custom' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
              className="text-xs sm:text-sm"
            >
              <FiFilter className="ml-1" />
              <span>مخصص</span>
            </Button>
          </div>
          
          {/* عرض النطاق الزمني الحالي */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border shadow-sm w-full mb-3">
            <FiCalendar className="text-primary ml-2 flex-shrink-0" />
            <div className="text-sm">
              {dateRange.from && dateRange.to ? (
                <span>
                  من <span className="font-semibold">{format(dateRange.from, 'yyyy/MM/dd')}</span> إلى <span className="font-semibold">{format(dateRange.to, 'yyyy/MM/dd')}</span>
                </span>
              ) : dateRange.from ? (
                <span>
                  من <span className="font-semibold">{format(dateRange.from, 'yyyy/MM/dd')}</span>
                </span>
              ) : dateRange.to ? (
                <span>
                  إلى <span className="font-semibold">{format(dateRange.to, 'yyyy/MM/dd')}</span>
                </span>
              ) : (
                <span className="font-semibold">جميع التواريخ</span>
              )}
            </div>
            
            {/* زر إزالة الفلتر */}
            {(dateRange.from || dateRange.to) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-auto p-1 h-7 text-gray-500"
                onClick={() => {
                  setCustomDateRange({ from: null, to: null });
                  onFilterChange(dateRanges.ALL);
                }}
              >
                إزالة الفلتر
              </Button>
            )}
          </div>
          
          {/* نافذة اختيار التاريخ المخصص */}
          {isCustomDateOpen && (
            <div className="border rounded-md p-3 bg-white shadow-md mb-4 max-h-[60vh] overflow-y-auto custom-date-scrollbar relative">
              <div className="text-center mb-2 font-medium">اختر نطاق زمني مخصص</div>
              
              <div className="space-y-4 pb-16">
                <div>
                  <label className="block text-sm mb-1">من:</label>
                  <Calendar
                    mode="single"
                    selected={customDateRange.from as Date}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                    className="border rounded-md mx-auto"
                    locale={ar}
                    disabled={{ after: customDateRange.to || undefined }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">إلى:</label>
                  <Calendar
                    mode="single"
                    selected={customDateRange.to as Date}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                    className="border rounded-md mx-auto"
                    locale={ar}
                    disabled={{ before: customDateRange.from || undefined }}
                  />
                </div>
              </div>
                
              <div className="sticky-buttons flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCustomDateRange({ from: null, to: null })}
                >
                  إعادة ضبط
                </Button>
                <Button 
                  size="sm"
                  onClick={applyCustomDateFilter}
                >
                  تطبيق
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* قائمة الطلبات */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <div className="text-lg font-medium mb-2">لا توجد طلبات في هذه الفترة</div>
              <p className="text-gray-500">
                قم بتحديد فترة زمنية أخرى لعرض سجل الطلبات
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* رأس الطلب */}
                <div 
                  className="p-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpanded(order.id)}
                >
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{formatFullDate(order.created_at)}</div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        مكتمل
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="text-gray-600">
                        رقم الطلب: <span className="text-gray-700 font-medium">{order.id.substring(0, 8)}</span>
                      </div>
                      <div className="font-bold">{order.total_amount.toFixed(2)} جنيه</div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {expandedOrders[order.id] ? (
                      <FiChevronUp className="text-gray-500" />
                    ) : (
                      <FiChevronDown className="text-gray-500" />
                    )}
                  </div>
                </div>
                
                {/* تفاصيل الطلب */}
                {expandedOrders[order.id] && (
                  <div className="p-4 border-t border-gray-100">
                    {/* نوع الطلب والملاحظات */}
                    {order.notes && (
                      <div className="bg-amber-50 p-3 rounded-md border border-amber-100 mb-4">
                        <div className="font-medium mb-1">ملاحظات الطلب:</div>
                        <div className="text-gray-700">{order.notes}</div>
                      </div>
                    )}
                    
                    {/* عناصر الطلب للشاشات الكبيرة */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-right">
                            <th className="p-2 text-gray-600 font-medium">المنتج</th>
                            <th className="p-2 text-gray-600 font-medium text-center">الكمية</th>
                            <th className="p-2 text-gray-600 font-medium text-center">السعر</th>
                            <th className="p-2 text-gray-600 font-medium text-center">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div>
                                    <div className="font-medium">{item.product_name}</div>
                                    <div className="text-sm text-gray-500">كود: {item.product_code}</div>
                                    {item.notes && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">ملاحظات:</span> {item.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2 text-center">{item.quantity}</td>
                              <td className="p-2 text-center">{item.unit_price?.toFixed(2) || '0.00'} جنيه</td>
                              <td className="p-2 text-center font-medium">{item.total_price?.toFixed(2) || '0.00'} جنيه</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="p-2 text-left rtl:text-right font-medium">الإجمالي</td>
                            <td className="p-2 text-center font-bold">{order.total_amount.toFixed(2)} جنيه</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    {/* عناصر الطلب للهواتف */}
                    <div className="md:hidden space-y-4">
                      {order.items.map(item => (
                        <div key={item.id} className="border-b border-gray-100 pb-3 mb-3">
                          <div className="font-medium mb-1">{item.product_name}</div>
                          <div className="text-sm text-gray-500 mb-2">كود: {item.product_code}</div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">الكمية:</span>
                              <div className="font-medium">{item.quantity}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">السعر:</span>
                              <div className="font-medium">{item.unit_price?.toFixed(2) || '0.00'} جنيه</div>
                            </div>
                            <div>
                              <span className="text-gray-500">الإجمالي:</span>
                              <div className="font-medium">{item.total_price?.toFixed(2) || '0.00'} جنيه</div>
                            </div>
                          </div>
                          
                          {item.notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">ملاحظات:</span>
                              <div className="text-gray-700">{item.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                        <div className="font-medium">الإجمالي:</div>
                        <div className="font-bold">{order.total_amount.toFixed(2)} جنيه</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 