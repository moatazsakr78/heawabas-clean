'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, UserProfile, getCurrentUserProfile } from '@/lib/auth';

// تعريف مفتاح موحد للمصادقة (نفس المفتاح المستخدم في layout.tsx)
const ADMIN_AUTH_KEY = 'admin_authenticated';

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
        // التحقق من حالة المسؤول من sessionStorage
        const adminAuthStatus = typeof window !== 'undefined' && 
          sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
        
        if (adminAuthStatus) {
          setIsAdmin(true);
        }
        
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getCurrentUserProfile();
          setProfile(userProfile);
          
          // إذا كان المستخدم مسؤولًا في قاعدة البيانات، قم بتعيين علامة المصادقة
          if (userProfile?.is_admin) {
            setIsAdmin(true);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
              localStorage.setItem(ADMIN_AUTH_KEY, 'true');
            }
          }
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
          
          // التحقق من حالة المسؤول من sessionStorage أولًا
          const adminAuthStatus = typeof window !== 'undefined' && 
            sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
          
          if (adminAuthStatus || userProfile?.is_admin) {
            setIsAdmin(true);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
              localStorage.setItem(ADMIN_AUTH_KEY, 'true');
            }
          } else {
            setIsAdmin(false);
          }
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