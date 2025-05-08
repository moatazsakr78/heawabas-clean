'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, UserProfile, getCurrentUserProfile } from '@/lib/auth';

// تعريف نوع سياق المصادقة
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

// إنشاء سياق المصادقة مع قيم افتراضية
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
});

// مكون مزود المصادقة
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getCurrentUserProfile();
          setProfile(userProfile);
          setIsAdmin(userProfile?.is_admin || false);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
    
    // الاشتراك بتغييرات حالة المصادقة
    const { data } = onAuthStateChange((authUser) => {
      setUser(authUser);
      
      if (authUser) {
        getCurrentUserProfile().then(userProfile => {
          setProfile(userProfile);
          setIsAdmin(userProfile?.is_admin || false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });
    
    // إلغاء الاشتراك عند إزالة المكون
    return () => {
      if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// دالة مساعدة لاستخدام سياق المصادقة
export function useAuth() {
  return useContext(AuthContext);
} 