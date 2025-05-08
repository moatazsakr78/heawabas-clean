'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiArrowRight, FiPackage, FiCheck, FiCheckCircle, FiHome, FiEdit, FiX, FiTrash, FiMinus, FiPlus } from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';

// تعريف واجهات البيانات
interface Product {
  id: string;
  name: string;
  productCode: string;
  piecePrice: number;
  imageUrl: string;
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
  note?: string;
  is_prepared: boolean;
  product?: Product;
}

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  total_amount?: number;
  status?: string;
  notes?: string;
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    username?: string;
  };
  in_preparation?: boolean;
}

export default function PrepareOrderPage({ params }: { params: { id: string } }) {
  const orderId = params.id;
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingOrder, setCompletingOrder] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<{ [key: string]: OrderItem[] }>({});
  const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});
  const [savingOrder, setSavingOrder] = useState(false);

  // تحميل بيانات الطلب
  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // الحصول على بيانات الطلب
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        throw orderError;
      }

      // الحصول على عناصر الطلب
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (itemsError) {
        throw itemsError;
      }

      // الحصول على بيانات المستخدم
      let userData: any = null;
      try {
        const { data: userResult, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', orderData.user_id)
          .single();
        
        if (!userError && userResult) {
          userData = userResult;
        } else {
          // محاولة الحصول على البيانات من جدول المستخدمين
          console.log('Trying to get username via RPC');
          const { data: username, error } = await supabase.rpc('get_username_by_id', {
            user_id: orderData.user_id
          });
          
          if (!error && username) {
            userData = {
              id: orderData.user_id,
              username: username
            };
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // تجميع البيانات للعرض
      const orderItems = orderItemsData.map(item => ({
        ...item,
        is_prepared: item.is_prepared === true
      }));

      // تحميل صور المنتجات وبياناتها
      const productIds = orderItems.map(item => item.product_id);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      // ربط بيانات المنتجات مع عناصر الطلب
      const itemsWithProducts = orderItems.map(item => {
        const product = productsData?.find(p => p.id === item.product_id);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            productCode: product.product_code,
            piecePrice: product.price || product.piece_price || 0,
            imageUrl: product.image_url || product.imageUrl || ''
          } : undefined
        };
      });

      // تكوين كائن الطلب الكامل
      const completeOrder: Order = {
        ...orderData,
        items: itemsWithProducts,
        user: userData ? {
          id: userData.id,
          email: userData.email || '',
          username: userData.username || ''
        } : undefined
      };

      setOrder(completeOrder);
    } catch (error) {
      console.error('Error loading order details:', error);
      setError('حدث خطأ أثناء تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  // تغيير حالة تحضير عنصر
  const handleToggleItemPrepared = async (itemId: string, isPrepared: boolean) => {
    if (!order) return;
    
    try {
      // تحديث حالة العنصر في قاعدة البيانات
      const { error } = await supabase
        .from('order_items')
        .update({ is_prepared: isPrepared })
        .eq('id', itemId);
      
      if (error) {
        console.error('Error updating item prepared status:', error);
        alert('حدث خطأ أثناء تحديث حالة التحضير');
        return;
      }
      
      // تحديث الحالة المحلية
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        
        const updatedItems = prevOrder.items.map(item => {
          if (item.id === itemId) {
            return { ...item, is_prepared: isPrepared };
          }
          return item;
        });
        
        return { ...prevOrder, items: updatedItems };
      });
    } catch (error) {
      console.error('Error updating item prepared status:', error);
      alert('حدث خطأ غير متوقع أثناء تحديث حالة التحضير');
    }
  };

  // إكمال الطلب
  const handleCompleteOrder = async () => {
    if (!order) return;
    
    // التحقق من أن جميع العناصر تم تحضيرها
    const allItemsPrepared = order.items.every(item => item.is_prepared);
    
    if (!allItemsPrepared) {
      if (!confirm('لم يتم تحضير جميع العناصر بعد. هل أنت متأكد من إكمال الطلب؟')) {
        return;
      }
    }
    
    try {
      setCompletingOrder(true);
      
      // تحديث حالة الطلب إلى "مكتمل"
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          in_preparation: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (error) {
        console.error('Error completing order:', error);
        alert('حدث خطأ أثناء إكمال الطلب');
        return;
      }
      
      alert('تم إكمال الطلب بنجاح!');
      router.push('/admin/customer-orders');
    } catch (error) {
      console.error('Error completing order:', error);
      alert('حدث خطأ غير متوقع أثناء إكمال الطلب');
    } finally {
      setCompletingOrder(false);
    }
  };

  // تعديل الطلب - وضع التعديل
  const handleEnterEditMode = () => {
    if (!order) return;
    
    // حفظ نسخة من عناصر الطلب للتعديل
    setEditedItems({
      [order.id]: [...order.items]
    });
    
    // حفظ ملاحظات الطلب
    setEditedNotes({
      [order.id]: order.notes || ''
    });
    
    setIsEditMode(true);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    if (confirm('هل أنت متأكد من إلغاء التعديل؟')) {
      setIsEditMode(false);
    }
  };

  // تغيير كمية عنصر
  const handleChangeQuantity = (itemId: string, change: number) => {
    if (!order) return;
    
    setEditedItems(prev => {
      const updatedItems = [...prev[order.id]];
      const itemIndex = updatedItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        const item = updatedItems[itemIndex];
        const newQuantity = Math.max(1, item.quantity + change); // الحد الأدنى 1
        
        // تحديث الكمية وإعادة حساب السعر الإجمالي
        updatedItems[itemIndex] = {
          ...item,
          quantity: newQuantity,
          total_price: item.unit_price * newQuantity
        };
      }
      
      return {
        ...prev,
        [order.id]: updatedItems
      };
    });
  };

  // إزالة منتج من الطلب
  const handleRemoveItem = (itemId: string) => {
    if (!order) return;
    
    if (confirm('هل أنت متأكد من حذف هذا المنتج من الطلب؟')) {
      setEditedItems(prev => {
        const updatedItems = prev[order.id].filter(item => item.id !== itemId);
        return {
          ...prev,
          [order.id]: updatedItems
        };
      });
    }
  };

  // حفظ التغييرات
  const handleSaveChanges = async () => {
    if (!order) return;
    
    try {
      setSavingOrder(true);
      
      const orderId = order.id;
      const editedOrderItems = editedItems[orderId];
      const orderNotes = editedNotes[orderId] || '';
      
      if (!editedOrderItems || editedOrderItems.length === 0) {
        alert('لا يمكن حفظ طلب بدون منتجات');
        return;
      }
      
      // حساب المبلغ الإجمالي الجديد
      const newTotal = editedOrderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      
      // تحديث عناصر الطلب
      for (const item of editedOrderItems) {
        // تحديث البيانات الحالية أو إضافة عناصر جديدة
        const { error: itemError } = await supabase
          .from('order_items')
          .upsert({
            id: item.id,
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            notes: item.notes || item.note || '',
            is_prepared: item.is_prepared || false
          });
        
        if (itemError) {
          throw new Error(`خطأ في تحديث عنصر: ${itemError.message}`);
        }
      }
      
      // حذف العناصر المحذوفة
      const currentItemIds = editedOrderItems.map(item => item.id);
      const originalItemIds = order.items.map(item => item.id);
      const deletedItemIds = originalItemIds.filter(id => !currentItemIds.includes(id));
      
      if (deletedItemIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .in('id', deletedItemIds);
        
        if (deleteError) {
          throw new Error(`خطأ في حذف العناصر: ${deleteError.message}`);
        }
      }
      
      // تحديث الطلب الرئيسي
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          notes: orderNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (orderUpdateError) {
        throw new Error(`خطأ في تحديث الطلب: ${orderUpdateError.message}`);
      }
      
      // تحديث البيانات المحلية
      setOrder({
        ...order,
        items: editedOrderItems,
        notes: orderNotes,
        total_amount: newTotal
      });
      
      // إغلاق وضع التعديل
      setIsEditMode(false);
      alert('تم حفظ التغييرات بنجاح');
      
    } catch (error) {
      console.error('Error saving changes:', error);
      alert(`حدث خطأ أثناء حفظ التغييرات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setSavingOrder(false);
    }
  };

  // العودة إلى صفحة طلبات العملاء
  const handleGoBack = async () => {
    router.push('/admin/customer-orders');
  };

  // تعديل الطلب
  const handleEditOrder = async () => {
    handleEnterEditMode();
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-60 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error || 'لم يتم العثور على الطلب'}</p>
          <Button onClick={handleGoBack} className="mt-4">
            <FiHome className="ml-2" />
            العودة إلى قائمة الطلبات
          </Button>
        </div>
      </div>
    );
  }

  // حساب إجمالي العناصر المحضرة
  const preparedItemsCount = order.items.filter(item => item.is_prepared).length;
  const totalItemsCount = order.items.length;
  const preparationProgress = Math.round((preparedItemsCount / totalItemsCount) * 100);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <FiArrowRight />
          العودة إلى قائمة الطلبات
        </Button>
        <h1 className="text-2xl font-bold text-center">تحضير الطلب</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* معلومات الطلب والعميل */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2 bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <CardTitle className="text-lg mb-1">
                  العميل: {order.user?.username || 'عميل'}
                </CardTitle>
                <CardDescription>
                  رقم الطلب: {order.id.substring(0, 8)}
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500 mt-2 md:mt-0">
                {formatDate(order.created_at)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">تقدم التحضير:</span>
                <span className="font-medium">{preparedItemsCount} من {totalItemsCount} ({preparationProgress}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${preparationProgress}%` }}></div>
              </div>
            </div>
            
            {isEditMode ? (
              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium">ملاحظات على الطلب كامل:</label>
                <textarea 
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="أضف ملاحظات على الطلب بالكامل..."
                  value={editedNotes[order.id] || ''}
                  onChange={(e) => setEditedNotes({
                    ...editedNotes,
                    [order.id]: e.target.value
                  })}
                />
              </div>
            ) : order.notes ? (
              <div className="mt-4 p-3 bg-[rgb(227,223,223)] rounded-md border border-[rgb(207,203,203)]">
                <span className="font-semibold block mb-1">ملاحظات الطلب:</span>
                <p>{order.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        
        {/* قائمة المنتجات للتحضير */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>منتجات الطلب ({(isEditMode ? editedItems[order.id] : order.items).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(isEditMode ? editedItems[order.id] : order.items).map(item => (
                  <div key={item.id} className={`p-4 rounded-lg border transition-colors ${isEditMode ? 'bg-blue-50' : item.is_prepared ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* صورة المنتج */}
                      {item.product?.imageUrl && (
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product_name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      
                      {/* تفاصيل المنتج */}
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-lg">{item.product_name}</h3>
                          {isEditMode ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 transition-colors hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <FiTrash size={14} className="hover:text-red-700 transition-colors" />
                            </Button>
                          ) : (
                            <div className="flex items-center">
                              <Checkbox 
                                id={`item-prepared-${item.id}`}
                                checked={item.is_prepared}
                                onCheckedChange={(checked) => 
                                  handleToggleItemPrepared(item.id, checked === true)
                                }
                                className="h-5 w-5"
                                disabled={isEditMode}
                              />
                              <label htmlFor={`item-prepared-${item.id}`} className="mr-2 text-sm font-medium cursor-pointer">
                                {item.is_prepared ? 'تم التحضير' : 'تحضير'}
                              </label>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-gray-500 text-sm mb-2">كود: {item.product_code}</div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <span className="text-gray-500 text-sm">الكمية</span>
                            {isEditMode ? (
                              <div className="flex items-center mt-1">
                                <Button 
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleChangeQuantity(item.id, -1)}
                                  className="h-8 w-8"
                                >
                                  <FiMinus size={14} />
                                </Button>
                                <span className="mx-3 font-bold">{item.quantity}</span>
                                <Button 
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleChangeQuantity(item.id, 1)}
                                  className="h-8 w-8"
                                >
                                  <FiPlus size={14} />
                                </Button>
                              </div>
                            ) : (
                              <p className="font-bold">{item.quantity}</p>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">السعر</span>
                            <p className="font-bold">{item.unit_price} جنيه</p>
                          </div>
                        </div>
                        
                        {(item.notes || item.note) && !isEditMode && (
                          <div className="mt-3 p-2 bg-[rgb(227,223,223)] rounded border border-[rgb(207,203,203)]">
                            <span className="text-gray-700 text-sm font-medium">ملاحظات:</span>
                            <p className="text-sm">{item.notes || item.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* ملخص الطلب وأزرار الإجراءات */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>عدد الأصناف:</span>
                  <span>{(isEditMode ? editedItems[order.id] : order.items).length}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>الأصناف المحضرة:</span>
                  <span className="font-medium">{preparedItemsCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>الإجمالي:</span>
                  <span className="font-bold">
                    {isEditMode 
                      ? editedItems[order.id].reduce((sum, item) => sum + (item.unit_price * item.quantity), 0).toFixed(2) 
                      : order.total_amount?.toFixed(2) || 0
                    } جنيه
                  </span>
                </div>
              </div>
              
              {isEditMode ? (
                <div className="mt-6 flex flex-col gap-3">
                  <Button 
                    onClick={handleSaveChanges}
                    className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                    disabled={savingOrder}
                  >
                    {savingOrder ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الحفظ...
                      </span>
                    ) : (
                      <>
                        <FiCheck className="ml-1" />
                        حفظ التغييرات
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="w-full border-gray-300 transition-colors hover:bg-gray-100"
                  >
                    <FiX className="ml-1" />
                    إلغاء التعديل
                  </Button>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 transition-colors" 
                    onClick={handleCompleteOrder}
                    disabled={completingOrder || isEditMode}
                  >
                    {completingOrder ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري إكمال الطلب...
                      </span>
                    ) : (
                      <>
                        <FiCheckCircle className="ml-2" />
                        إتمام الطلب
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleEditOrder}
                    className="w-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    disabled={isEditMode}
                  >
                    <FiEdit className="ml-2" />
                    تعديل الطلب
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 