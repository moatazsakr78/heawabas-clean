'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      setEmail('');
    } catch (err) {
      setError('حدث خطأ أثناء إرسال طلب إعادة التعيين');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">إعادة تعيين كلمة المرور</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
            <p className="text-sm text-gray-600 mt-2">
              أدخل بريدك الإلكتروني المسجل وسيتم إرسال رابط إعادة تعيين كلمة المرور إليك.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            تذكرت كلمة المرور؟{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 