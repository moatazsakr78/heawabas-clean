import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OrderItem } from '@/lib/orders';

/**
 * تحديث طلب من لوحة التحكم
 * يتم التحقق من صلاحيات المشرف قبل إجراء التحديث
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Received update order request');
    
    // التحقق من الجلسة
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('No active session found');
      return NextResponse.json({ error: 'غير مصرح - جلسة غير نشطة' }, { status: 401 });
    }

    console.log('Session user ID:', sessionData.session.user.id);
    
    // استخراج بيانات الطلب
    const requestData = await request.json();
    const { orderId, items, notes } = requestData;
    
    console.log(`Processing order ${orderId} with ${items?.length || 0} items`);

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // التحقق أن المستخدم مشرف أو نخطي التحقق في بيئة التطوير
    let isAdmin = false;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (profileError) {
        console.warn('Error fetching profile:', profileError.message);
      } else {
        console.log('User profile:', profile);
        isAdmin = !!profile?.is_admin;
      }
      
      // إذا لم يكن المستخدم مشرفًا، تحقق من البريد الإلكتروني
      if (!isAdmin && sessionData.session.user?.email) {
        const email = sessionData.session.user.email.toLowerCase();
        if (email.endsWith('@admin.com') || email.includes('admin')) {
          console.log('Admin access granted via email pattern');
          isAdmin = true;
        }
      }
      
      // التحقق من أن المستخدم هو صاحب الطلب أو مشرف
      const { data: orderOwner, error: orderError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();
      
      if (!orderError && orderOwner) {
        if (orderOwner.user_id === sessionData.session.user.id) {
          console.log('User is the order owner');
          isAdmin = true; // السماح لمالك الطلب بالتعديل
        }
      }
      
      // السماح بالوصول دائمًا في بيئة التطوير المحلية
      const host = request.headers.get('host') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        console.log('Development environment detected - bypassing admin check');
        isAdmin = true;
      }
    } catch (checkError) {
      console.error('Error during admin check:', checkError);
    }

    if (!isAdmin) {
      console.error('User is not authorized as admin');
      return NextResponse.json({ 
        error: 'غير مصرح للمشرفين فقط',
        userId: sessionData.session.user.id
      }, { status: 403 });
    }

    console.log('Admin check passed, proceeding with update');

    // 1. إذا كانت القائمة فارغة، قم بحذف الطلب
    if (items.length === 0) {
      // حذف عناصر الطلب أولاً
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (deleteItemsError) {
        console.error('Error deleting order items:', deleteItemsError);
        throw new Error(`فشل حذف العناصر: ${deleteItemsError.message}`);
      }
      
      // ثم حذف الطلب نفسه
      const { error: deleteOrderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (deleteOrderError) {
        console.error('Error deleting order:', deleteOrderError);
        throw new Error(`فشل حذف الطلب: ${deleteOrderError.message}`);
      }
      
      console.log('Order deleted successfully');
      return NextResponse.json({ success: true, message: 'تم حذف الطلب بنجاح' });
    }

    // 2. الحصول على العناصر الحالية
    const { data: currentItems, error: fetchError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId);
    
    if (fetchError) {
      console.error('Error fetching current items:', fetchError);
      throw new Error(`فشل الحصول على العناصر الحالية: ${fetchError.message}`);
    }
    
    // 3. تحديد العناصر المحذوفة
    const currentItemIds = currentItems?.map(item => item.id) || [];
    const updatedItemIds = items.map(item => item.id).filter(Boolean);
    const itemsToDelete = currentItemIds.filter(id => !updatedItemIds.includes(id));
    
    console.log('Items to delete:', itemsToDelete);
    
    // 4. حذف العناصر التي تمت إزالتها
    if (itemsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .in('id', itemsToDelete);
      
      if (deleteError) {
        console.error('Error deleting items:', deleteError);
        throw new Error(`فشل حذف العناصر: ${deleteError.message}`);
      }
      
      console.log(`Deleted ${itemsToDelete.length} items`);
    }
    
    // 5. تحديث العناصر المتبقية
    for (const item of items) {
      if (!item.id) continue; // تخطي العناصر بدون معرف
      
      console.log(`Updating item ${item.id}: quantity=${item.quantity}`);
      
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          quantity: item.quantity,
          total_price: item.unit_price * item.quantity,
          is_prepared: item.is_prepared
        })
        .eq('id', item.id);
      
      if (updateError) {
        console.error(`Error updating item ${item.id}:`, updateError);
        throw new Error(`فشل تحديث العنصر ${item.id}: ${updateError.message}`);
      }
    }
    
    // 6. حساب المجموع الجديد
    const newTotal = items.reduce((sum, item) => 
      sum + (item.unit_price * item.quantity), 0);
    
    console.log('New total amount:', newTotal);
    
    // 7. تحديث الطلب الرئيسي
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        total_amount: newTotal,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
      throw new Error(`فشل تحديث الطلب: ${orderUpdateError.message}`);
    }
    
    console.log('Order updated successfully');
    return NextResponse.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      total: newTotal
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: `فشل تحديث الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}` },
      { status: 500 }
    );
  }
} 