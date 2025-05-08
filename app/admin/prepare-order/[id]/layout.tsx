import React from 'react';
import '@/styles/globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import ClientInitProvider from '@/components/storage/ClientInitProvider';

export default function PrepareOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="full-page-root">
      <body className="full-page-mode">
        <AuthProvider>
          <ClientInitProvider />
          <div className="full-page-container">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 