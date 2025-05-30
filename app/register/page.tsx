'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/auth'; // استيراد عميل supabase لتسجيل الدخول

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تطابق كلمات المرور
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }
    
    // التحقق من إدخال اسم المستخدم
    if (!username.trim()) {
      setError('الرجاء إدخال اسم المستخدم');
      return;
    }
    
    if (username.length < 3) {
      setError('يجب أن يكون اسم المستخدم 3 أحرف على الأقل');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      console.log('Attempting to sign up with:', {
        email,
        username,
        passwordLength: password.length
      });

      // استخدام الدالة الطرفية الجديدة بدلاً من وظيفة signUp
      const response = await fetch('https://jpwsohttsxsmyhasvudy.supabase.co/functions/v1/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });

      const result = await response.json();
      
      console.log('Registration result:', result);
      
      if (!response.ok) {
        // فشل التسجيل
        setError(result.error || 'حدث خطأ أثناء التسجيل');
        return;
      }
      
      // تسجيل الدخول تلقائياً بعد إنشاء الحساب بنجاح
      setMessage('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
      
      // استخدام signInWithPassword لتسجيل الدخول مباشرة
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Error signing in automatically:', signInError);
        setMessage('تم إنشاء الحساب بنجاح، ولكن فشل تسجيل الدخول التلقائي. يرجى تسجيل الدخول يدوياً.');
        
        // توجيه المستخدم إلى صفحة تسجيل الدخول بعد 3 ثوان
        setTimeout(() => {
          router.push('/login');
        }, 3000);
        return;
      }
      
      // نجح تسجيل الدخول
      console.log('Automatic sign in successful:', signInData);
      setMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح! جاري تحويلك...');
      
      // إعادة التوجيه إلى الصفحة الرئيسية بعد ثانية واحدة
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Registration error details:', err);
      setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h1>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 