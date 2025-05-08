'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getCurrentUserProfile, updateUserProfile, UserProfile } from '@/lib/auth';
import OrdersList from '@/components/ui/OrdersList';

export default function Profile() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOrders, setShowOrders] = useState(false);
  const router = useRouter();

  // بيانات النموذج
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');

  // قائمة المحافظات المصرية
  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'الدقهلية',
    'الشرقية', 'القليوبية', 'المنوفية', 'الغربية', 'بور سعيد', 'الإسماعيلية',
    'السويس', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'الوادي الجديد',
    'مطروح', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا',
    'الأقصر', 'أسوان'
  ];

  useEffect(() => {
    // التحقق مما إذا كان هناك معلمة استعلام view=orders
    const viewParam = searchParams.get('view');
    if (viewParam === 'orders') {
      setShowOrders(true);
    }
    
    const loadUserProfile = async () => {
      try {
        // التحقق من وجود مستخدم مسجل
        const authUser = await getCurrentUser();
        if (!authUser) {
          router.push('/login');
          return;
        }

        // جلب بيانات ملف المستخدم
        const profile = await getCurrentUserProfile();
        if (profile) {
          setUser(profile);
          // تعيين القيم الافتراضية للنموذج
          setUsername(profile.username || '');
          setPhone(profile.phone || '');
          setAddress(profile.address || '');
          setGovernorate(profile.governorate || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('حدث خطأ أثناء تحميل بيانات الملف الشخصي');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUpdating(true);

    try {
      const { data, error } = await updateUserProfile({
        username,
        phone,
        address,
        governorate
      });

      if (error) {
        setError('حدث خطأ أثناء تحديث البيانات');
        console.error('Update error:', error);
        return;
      }

      // تحديث البيانات المحلية
      if (data && data.length > 0) {
        setUser(data[0] as UserProfile);
      }
      
      setSuccess('تم تحديث البيانات بنجاح');
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      console.error('Unexpected error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">الملف الشخصي</h1>
        
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowOrders(false)}
            className={`px-4 py-2 mx-2 rounded-md ${!showOrders ? 'bg-[#5D1F1F] text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            الملف الشخصي
          </button>
          <button
            onClick={() => setShowOrders(true)}
            className={`px-4 py-2 mx-2 rounded-md ${showOrders ? 'bg-[#5D1F1F] text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            قائمة الطلبات
          </button>
        </div>
        
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
        
        {!showOrders ? (
          <>
            <div className="mb-6 text-center">
              <p className="text-gray-600">البريد الإلكتروني: {user?.email}</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  الاسم
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="governorate">
                  المحافظة
                </label>
                <select
                  id="governorate"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                  العنوان
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-[#5D1F1F] hover:bg-[#4A1818] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                  disabled={updating}
                >
                  {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <OrdersList />
        )}
      </div>
    </div>
  );
} 