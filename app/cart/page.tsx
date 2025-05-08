'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash, FiPlus, FiMinus, FiEdit, FiX } from 'react-icons/fi';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateNotes, clearCart } = useCart();
  const { user } = useAuth();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempNotes, setTempNotes] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    // التحقق من وجود طلب للتعديل في التخزين المحلي
    const editOrderId = localStorage.getItem('editOrderId');
    setIsEditMode(!!editOrderId);
  }, []);
  
  // إلغاء وضع التعديل
  const cancelEditMode = () => {
    if (confirm('هل أنت متأكد من إلغاء التعديل؟')) {
      localStorage.removeItem('editOrderId');
      clearCart();
      window.location.href = '/profile?view=orders';
    }
  };
  
  // If user is not logged in, redirect to login
  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">يرجى تسجيل الدخول</h1>
          <p className="mb-6">يجب تسجيل الدخول لعرض سلة الطلبات</p>
          <Link
            href="/login"
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total
  const total = items.reduce((sum, item) => {
    return sum + (item.product.piecePrice * item.quantity);
  }, 0);

  const handleEditQuantity = (productId: string, currentQuantity: number) => {
    setEditingItem(productId);
    setTempQuantity(currentQuantity);
  };

  const handleEditNotes = (productId: string, currentNotes: string = '') => {
    setEditingNotes(productId);
    setTempNotes(currentNotes);
  };

  const saveQuantity = (productId: string) => {
    updateQuantity(productId, tempQuantity);
    setEditingItem(null);
  };

  const saveNotes = (productId: string) => {
    updateNotes(productId, tempNotes);
    setEditingNotes(null);
  };

  const incrementQuantity = () => {
    setTempQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setTempQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">سلة الطلبات فارغة</h1>
          <p className="mb-6">لم تقم بإضافة أية منتجات إلى سلة الطلبات</p>
          <Link
            href="/"
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            عودة للمنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold text-primary mb-6 text-center">
          {isEditMode ? 'تعديل الطلب' : 'ملخص الطلب'}
        </h1>
        
        {/* Desktop View - Table Format */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-right">المنتج</th>
                <th className="py-3 px-4 text-center">السعر</th>
                <th className="py-3 px-4 text-center">الكمية</th>
                <th className="py-3 px-4 text-center">الإجمالي</th>
                <th className="py-3 px-4 text-center">ملاحظات</th>
                <th className="py-3 px-4 text-center">حذف</th>
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
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">{item.product.piecePrice} جنيه</td>
                  <td className="py-4 px-4 text-center">
                    {editingItem === item.product.id ? (
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={decrementQuantity}
                          className="bg-gray-200 p-1 rounded-md hover:bg-gray-300"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-10 text-center">{tempQuantity}</span>
                        <button
                          onClick={incrementQuantity}
                          className="bg-gray-200 p-1 rounded-md hover:bg-gray-300"
                        >
                          <FiPlus size={16} />
                        </button>
                        <button
                          onClick={() => saveQuantity(item.product.id)}
                          className="bg-green-500 text-white p-1 rounded-md hover:bg-green-600 mr-2"
                        >
                          حفظ
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleEditQuantity(item.product.id, item.quantity)}
                        className="cursor-pointer flex items-center justify-center"
                      >
                        {item.quantity} <FiEdit className="mr-1 text-gray-500 hover:text-primary" size={16} />
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {(item.product.piecePrice * item.quantity).toFixed(2)} جنيه
                  </td>
                  <td className="py-4 px-4 text-center">
                    {editingNotes === item.product.id ? (
                      <div className="flex flex-col items-center justify-center">
                        <textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          className="w-40 h-20 border border-gray-300 rounded-md p-2 mb-2 resize-none"
                        />
                        <button
                          onClick={() => saveNotes(item.product.id)}
                          className="bg-green-500 text-white px-4 py-1 rounded-md hover:bg-green-600"
                        >
                          حفظ
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleEditNotes(item.product.id, item.notes)}
                        className="cursor-pointer flex items-center justify-center"
                      >
                        {item.notes ? 
                          <span className="truncate max-w-xs">{item.notes.substring(0, 15)}{item.notes.length > 15 ? '...' : ''}</span> : 
                          <FiEdit className="text-gray-500 hover:text-primary" size={16} />
                        }
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash size={18} />
                    </button>
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
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Mobile View - Card Format */}
        <div className="md:hidden">
          {items.map(item => (
            <div key={item.product.id} className="bg-gray-50 rounded-lg p-4 mb-4 relative">
              <button
                onClick={() => removeItem(item.product.id)}
                className="absolute top-2 left-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
              >
                <FiX size={18} />
              </button>
              
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
                  <p className="text-gray-500 text-sm">الإجمالي</p>
                  <p className="font-bold">{(item.product.piecePrice * item.quantity).toFixed(2)} جنيه</p>
                </div>
                
                <div className="bg-white p-2 rounded-md">
                  <p className="text-gray-500 text-sm mb-1">الكمية</p>
                  {editingItem === item.product.id ? (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={decrementQuantity}
                        className="bg-gray-200 p-1 rounded-md hover:bg-gray-300 w-7 h-7 flex items-center justify-center"
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-8 text-center font-bold">{tempQuantity}</span>
                      <button
                        onClick={incrementQuantity}
                        className="bg-gray-200 p-1 rounded-md hover:bg-gray-300 w-7 h-7 flex items-center justify-center"
                      >
                        <FiPlus size={16} />
                      </button>
                      <button
                        onClick={() => saveQuantity(item.product.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded-md text-xs hover:bg-green-600"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEditQuantity(item.product.id, item.quantity)}
                      className="cursor-pointer flex items-center font-bold"
                    >
                      <span>{item.quantity}</span>
                      <FiEdit className="mr-1 text-gray-500" size={16} />
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-2 rounded-md">
                  <p className="text-gray-500 text-sm mb-1">ملاحظات</p>
                  {editingNotes === item.product.id ? (
                    <div className="flex flex-col">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        className="w-full h-16 border border-gray-300 rounded-md p-1 mb-1 text-sm resize-none"
                      />
                      <button
                        onClick={() => saveNotes(item.product.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded-md text-xs hover:bg-green-600 self-end"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEditNotes(item.product.id, item.notes)}
                      className="cursor-pointer flex items-start"
                    >
                      <div className="truncate text-sm overflow-hidden max-h-10">
                        {item.notes || <FiEdit className="text-gray-500" size={16} />}
                      </div>
                    </div>
                  )}
                </div>
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
        
        <div className="mt-8 flex justify-between">
          {isEditMode ? (
            <>
              <button
                onClick={cancelEditMode}
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
              >
                إلغاء التعديل
              </button>
              <Link
                href="/checkout"
                className="bg-[#5D1F1F] text-white px-6 py-2 rounded-md hover:bg-[#4a1919]"
              >
                تحديث الطلب
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={clearCart}
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600"
              >
                إلغاء الطلب
              </button>
              <Link
                href="/checkout"
                className="bg-[#5D1F1F] text-white px-6 py-2 rounded-md hover:bg-[#4a1919]"
              >
                إرسال الطلب
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 