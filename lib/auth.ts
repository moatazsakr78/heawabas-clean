// وظائف إدارة المصادقة مع Supabase
import { createClient } from '@supabase/supabase-js';
import { User, Session } from '@supabase/supabase-js';

// استخدام متغيرات البيئة أو القيم الافتراضية
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpwsohttsxsmyhasvudy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd3NvaHR0c3hzbXloYXN2dWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0OTAsImV4cCI6MjA2MjAyMzQ5MH0.3smkZyO8z7B69lCEPebl3nI7WKHfkl2badoVYxvIgnw';

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// واجهة بيانات المستخدم
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  address?: string;
  governorate?: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

// التحقق من وجود اسم المستخدم
export async function checkUsernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_username_exists', { p_username: username })
    .single();
  
  if (error) {
    console.error('Error checking username:', error);
    return false;
  }
  
  return !!data;
}

// تسجيل مستخدم جديد
export async function signUp(email: string, password: string, username: string) {
  // التحقق من وجود اسم المستخدم أولاً
  const usernameExists = await checkUsernameExists(username);
  if (usernameExists) {
    return { 
      data: null, 
      error: { 
        message: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر'
      } 
    };
  }

  // تسجيل المستخدم مع إلغاء التأكيد عبر البريد الإلكتروني
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // إلغاء إرسال رسالة التأكيد
      emailRedirectTo: undefined,
      // تلقائياً اعتبار البريد الإلكتروني مؤكد
      data: {
        // إضافة اسم المستخدم في بيانات المستخدم
        username: username
      }
    }
  });
  
  if (error) return { data, error };
  
  // تحديث الـ username في جدول المستخدمين 
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .update({ username: username })
      .eq('id', data.user.id);
    
    if (profileError) {
      console.error('Error updating username:', profileError);
    }
    
    // تسجيل الدخول مباشرة بعد التسجيل لتفعيل الحساب
    await supabase.auth.updateUser({
      data: { email_confirmed: true }
    });
  }
  
  return { data, error };
}

// تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

// تسجيل الخروج
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// الحصول على المستخدم الحالي
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// الحصول على ملف المستخدم الحالي
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .rpc('get_current_user')
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
}

// تحديث ملف المستخدم
export async function updateUserProfile(profile: Partial<UserProfile>) {
  // إذا كان يتم تحديث اسم المستخدم، تحقق من وجوده مسبقاً
  if (profile.username) {
    // احصل على الملف الحالي لمقارنة الاسم القديم مع الجديد
    const currentProfile = await getCurrentUserProfile();
    
    // تحقق فقط إذا كان الاسم الجديد مختلفاً عن الاسم الحالي
    if (currentProfile && profile.username !== currentProfile.username) {
      const usernameExists = await checkUsernameExists(profile.username);
      
      if (usernameExists) {
        return { 
          data: null, 
          error: { 
            message: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر'
          } 
        };
      }
    }
  }

  const { data, error } = await supabase
    .rpc('update_user_profile', {
      p_username: profile.username,
      p_phone: profile.phone,
      p_address: profile.address,
      p_governorate: profile.governorate,
      p_avatar_url: profile.avatar_url
    });
  
  return { data, error };
}

// التحقق مما إذا كان المستخدم مسؤولاً
export async function isUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_admin')
    .single();
  
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  
  return !!data;
}

// الاستماع لتغييرات جلسة المستخدم
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// إعادة تعيين كلمة المرور
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  return { data, error };
}

// تغيير كلمة المرور
export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  return { data, error };
} 