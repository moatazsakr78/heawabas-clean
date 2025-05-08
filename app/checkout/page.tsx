'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { createOrder, updateOrder, OrderItem } from '@/lib/orders';

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>('');
  
  useEffect(() => {
    // التحقق من وجود طلب للتعديل في التخزين المحلي
    const storedOrderId = localStorage.getItem('editOrderId');
    if (storedOrderId) {
      setIsEditMode(true);
      setEditOrderId(storedOrderId);
    }

    // Redirect to cart if cart is empty
    if (items.length === 0) {
      router.push('/cart');
    }
    
    // Redirect to login if user is not logged in
    if (!user) {
      router.push('/login');
    }
  }, [items.length, user, router]);
  
  if (!user || items.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">جاري التحميل...</h1>
        </div>
      </div>
    );
  }

  // Calculate total
  const total = items.reduce((sum, item) => {
    return sum + (item.product.piecePrice * item.quantity);
  }, 0);

  const handleSubmitOrder = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Preparar los items de la orden
      const orderItems: OrderItem[] = items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_code: item.product.productCode,
        quantity: item.quantity,
        unit_price: item.product.piecePrice,
        total_price: item.product.piecePrice * item.quantity,
        notes: item.notes
      }));
      
      let result;
      
      if (isEditMode && editOrderId) {
        // تحديث الطلب الموجود
        result = await updateOrder(editOrderId, orderItems, orderNotes);
        
        // مسح معرف الطلب من التخزين المحلي
        localStorage.removeItem('editOrderId');
      } else {
        // إنشاء طلب جديد
        result = await createOrder({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          notes: orderNotes,
          items: orderItems
        });
      }
      
      if (result.success) {
        // Mostrar mensaje de éxito
        alert(isEditMode ? 'تم تحديث طلبك بنجاح!' : 'تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.');
        clearCart();
        router.push('/');
      } else {
        // Mostrar mensaje de error
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      setErrorMessage('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">
          {isEditMode ? 'تعديل الطلب' : 'تأكيد الطلب'}
        </h1>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">تفاصيل المنتجات</h2>
          
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-right">المنتج</th>
                  <th className="py-3 px-4 text-center">السعر</th>
                  <th className="py-3 px-4 text-center">الكمية</th>
                  <th className="py-3 px-4 text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.product.id} className="border-b">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {item.product.imageUrl && (
                          <div className="h-16 w-16 relative flex-shrink-0 ml-4">
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-gray-500">كود: {item.product.productCode}</div>
                          {item.notes && (
                            <div className="text-gray-500 mt-2">
                              <strong>ملاحظات:</strong> {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">{item.product.piecePrice} جنيه</td>
                    <td className="py-4 px-4 text-center">{item.quantity}</td>
                    <td className="py-4 px-4 text-center">
                      {(item.product.piecePrice * item.quantity).toFixed(2)} جنيه
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="py-4 px-4 text-left font-bold">
                    الإجمالي
                  </td>
                  <td className="py-4 px-4 text-center font-bold">
                    {total.toFixed(2)} جنيه
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Mobile View */}
          <div className="md:hidden">
            {items.map(item => (
              <div key={item.product.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  {item.product.imageUrl && (
                    <div className="h-16 w-16 relative flex-shrink-0 ml-3">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-lg">{item.product.name}</div>
                    <div className="text-gray-500">كود: {item.product.productCode}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-white p-2 rounded-md">
                    <p className="text-gray-500 text-sm">سعر القطعة</p>
                    <p className="font-bold">{item.product.piecePrice} جنيه</p>
                  </div>
                  
                  <div className="bg-white p-2 rounded-md">
                    <p className="text-gray-500 text-sm">الكمية</p>
                    <p className="font-bold">{item.quantity}</p>
                  </div>
                  
                  <div className="bg-white p-2 rounded-md col-span-2">
                    <p className="text-gray-500 text-sm">الإجمالي</p>
                    <p className="font-bold">{(item.product.piecePrice * item.quantity).toFixed(2)} جنيه</p>
                  </div>
                  
                  {item.notes && (
                    <div className="bg-white p-2 rounded-md col-span-2">
                      <p className="text-gray-500 text-sm">ملاحظات</p>
                      <p className="text-sm">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="bg-white rounded-lg p-4 shadow-md mt-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">الإجمالي:</span>
                <span className="font-bold text-lg text-primary">{total.toFixed(2)} جنيه</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="my-6">
          <h2 className="text-xl font-semibold mb-4">ملاحظات على الطلب</h2>
          <div className="bg-[rgb(227,223,223)] p-4 rounded-md border border-[rgb(207,203,203)]">
            <label htmlFor="orderNotes" className="block mb-2 text-gray-700">
              أضف ملاحظات على الطلب كامل (اختياري)
            </label>
            <textarea
              id="orderNotes"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="مثال: طريقة التسليم، أوقات التواصل المفضلة، أو أي ملاحظات أخرى..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Link
            href="/cart"
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            العودة إلى السلة
          </Link>
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className={`bg-[#5D1F1F] text-white px-6 py-2 rounded-md hover:bg-[#4a1919] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'جاري الإرسال...' : isEditMode ? 'تحديث الطلب' : 'تأكيد الطلب'}
          </button>
        </div>
      </div>
    </div>
  );
} 