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
  try {
    const { data, error } = await supabase
      .rpc('check_username_exists', { p_username: username })
      .single();
    
    if (error) {
      console.error('Error checking username:', error.message);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking username:', error);
    return false;
  }
}

// تسجيل مستخدم جديد
export async function signUp(email: string, password: string, username: string) {
  try {
    console.log('Starting signup process for:', email, 'with username:', username);

    // التحقق من وجود اسم المستخدم أولاً (باستخدام استعلام مباشر)
    console.log('Checking if username exists');
    
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1);

    if (userError) {
      console.error('Error checking existing users:', userError);
      return { 
        data: null, 
        error: { 
          message: 'حدث خطأ أثناء التحقق من اسم المستخدم'
        } 
      };
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Username already exists');
      return { 
        data: null, 
        error: { 
          message: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر'
        } 
      };
    }

    console.log('Proceeding with signup for', email);
    
    // تسجيل المستخدم باستخدام Supabase Auth API
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username // تخزين اسم المستخدم في البيانات الوصفية
        }
      }
    });
    
    console.log('Auth signup response:', data ? 'Success' : 'Failed', error ? `Error: ${error.message}` : 'No error');
    
    if (error) {
      console.error('Signup error:', error);
      return { data, error };
    }
    
    // التحقق من أن المستخدم تم إنشاؤه بنجاح
    if (!data?.user?.id) {
      console.error('No user ID returned from signup');
      return { 
        data: null, 
        error: { 
          message: 'فشل إنشاء المستخدم: لم يتم إرجاع معرف المستخدم'
        } 
      };
    }

    // التحقق من أن سجل المستخدم تم إنشاؤه في جدول users
    // إعطاء وقت للـ trigger ليعمل (1 ثانية)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userRecordError || !userRecord) {
      console.log('User record not created automatically, creating manually');
      
      // إنشاء سجل المستخدم يدويًا إذا لم يتم إنشاؤه بواسطة الـ trigger
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_admin: false
        });
      
      if (insertError) {
        console.error('Error creating user record manually:', insertError);
        return {
          data,
          error: {
            message: 'تم إنشاء حساب المستخدم ولكن فشل في إنشاء الملف الشخصي. الرجاء تسجيل الدخول والمحاولة مرة أخرى.'
          }
        };
      }
    }
    
    console.log('Signup completed successfully');
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in signUp function:', err);
    return { 
      data: null, 
      error: { 
        message: 'حدث خطأ غير متوقع أثناء التسجيل: ' + (err instanceof Error ? err.message : String(err))
      }
    };
  }
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