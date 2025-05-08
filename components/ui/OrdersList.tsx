'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { getUserOrders, deleteOrder } from '@/lib/orders';
import { getProductById } from '@/lib/products';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  note?: string;
  notes?: string;
  is_prepared?: boolean;
}

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  total_amount?: number;
  items: OrderItem[];
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const result = await getUserOrders();
        
        if (result.success && result.orders) {
          console.log('Orders loaded:', result.orders);
          
          // Transform orders to ensure all needed fields are present
          const transformedOrders = result.orders.map(order => {
            // Transform each item to ensure all fields have values
            const transformedItems = order.items.map(item => ({
              ...item,
              // Ensure product_name has a value
              product_name: item.product_name || 'منتج غير معروف',
              // Ensure product_code has a value
              product_code: item.product_code || '',
              // Ensure unit_price has a numeric value
              unit_price: typeof item.unit_price === 'number' ? item.unit_price : 0,
              // Ensure total_price has a numeric value
              total_price: typeof item.total_price === 'number' ? item.total_price : 
                           (typeof item.unit_price === 'number' ? item.unit_price * item.quantity : 0)
            }));
            
            // Return the transformed order
            return {
              ...order,
              // Calculate total_amount if not present
              total_amount: typeof order.total_amount === 'number' ? order.total_amount : 
                          transformedItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
              items: transformedItems
            };
          });
          
          console.log('Transformed orders:', transformedOrders);
          setOrders(transformedOrders);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('حدث خطأ أثناء تحميل الطلبات');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  // تحويل الطلب إلى عربة تسوق للتعديل
  const handleEditOrder = async (order: Order) => {
    try {
      // مسح سلة التسوق الحالية
      clearCart();
      
      // عرض رسالة تحميل
      setLoading(true);
      
      // حفظ معرف الطلب في التخزين المحلي للاستخدام في عملية التعديل
      localStorage.setItem('editOrderId', order.id);
      
      // إضافة عناصر الطلب إلى سلة التسوق
      for (const item of order.items || []) {
        try {
          // محاولة الحصول على معلومات المنتج الكاملة
          const productResult = await getProductById(item.product_id);
          
          if (productResult.success && productResult.product) {
            // إضافة المنتج مع معلوماته الكاملة
            addItem(productResult.product, item.quantity, item.note || item.notes);
          } else {
            // إذا فشل الحصول على المنتج، استخدم البيانات الأساسية من الطلب
            const basicProduct = {
              id: item.product_id,
              name: item.product_name || 'منتج غير معروف',
              productCode: item.product_code || '',
              piecePrice: item.unit_price || 0, 
              packPrice: 0,
              boxPrice: 0,
              boxQuantity: 1,
              imageUrl: '' 
            };
            
            addItem(basicProduct, item.quantity, item.note || item.notes);
          }
        } catch (err) {
          console.error(`Error fetching product ${item.product_id}:`, err);
          // استمر مع العناصر الأخرى
        }
      }
      
      // إنهاء التحميل
      setLoading(false);
      
      // انتقل إلى صفحة سلة التسوق
      router.push('/cart');
    } catch (err) {
      console.error('Error preparing cart:', err);
      setError('حدث خطأ أثناء تجهيز السلة');
      setLoading(false);
    }
  };

  // حذف الطلب
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        const result = await deleteOrder(orderId);
        
        if (result.success) {
          // تحديث قائمة الطلبات
          setOrders(orders.filter(order => order.id !== orderId));
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error('Error deleting order:', err);
        setError('حدث خطأ أثناء حذف الطلب');
      }
    }
  };

  // حساب إجمالي الطلب
  const calculateOrderTotal = (items: OrderItem[]): number => {
    return items.reduce((total, item) => {
      // استخدم total_price إذا كان متاحًا، وإلا احسب من الكمية والسعر الفردي
      if (item.total_price) {
        return total + item.total_price;
      } else if (item.unit_price) {
        return total + (item.unit_price * item.quantity);
      }
      return total;
    }, 0);
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // تنسيق الأرقام كعملة
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2) + ' جنيه';
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg">جاري تحميل الطلبات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <div className="text-lg mb-2">لا يوجد طلبات سابقة</div>
        <p className="text-gray-500">ابدأ بإضافة منتجات إلى سلة التسوق</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">قائمة الطلبات</h2>
      
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-500">رقم الطلب:</span>
              <span className="font-medium mx-2">{order.id.substring(0, 8)}</span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(order.created_at)}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">المنتجات:</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">المنتج</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500">الكمية</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500">السعر</th>
                    <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        {item.product_code && (
                          <div className="text-xs text-gray-500">كود: {item.product_code}</div>
                        )}
                        {(item.note || item.notes) && (
                          <div className="text-xs text-gray-500 mt-1">
                            ملاحظات: {item.note || item.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">{item.quantity}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                        {formatCurrency(item.unit_price || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                        {formatCurrency(item.total_price || (item.unit_price ? item.unit_price * item.quantity : 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-3 py-2 whitespace-nowrap text-sm font-bold text-left">الإجمالي</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-center">
                      {formatCurrency(order.total_amount || calculateOrderTotal(order.items))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={() => handleEditOrder(order)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm mx-2"
            >
              تعديل
            </button>
            <button
              onClick={() => handleDeleteOrder(order.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 