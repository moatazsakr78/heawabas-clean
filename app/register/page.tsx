'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';

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
      const { data, error } = await signUp(email, password, username);
      
      if (error) {
        if (error.message.includes('email already')) {
          setError('البريد الإلكتروني مستخدم بالفعل');
        } else {
          setError(error.message);
        }
        return;
      }
      
      // تم التسجيل بنجاح
      setMessage('تم التسجيل بنجاح! جاري تحويلك للصفحة الرئيسية...');
      
      // إعادة التوجيه إلى الصفحة الرئيسية بعد 3 ثوان
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err) {
      setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
      console.error('Registration error:', err);
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