'use client';

import { useState } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { useCart } from '@/components/CartProvider';

// Sample product data for testing
const sampleProducts = [
  {
    id: '1',
    name: 'راديو موجات أصلي',
    productCode: 'ABC123',
    boxQuantity: 6,
    piecePrice: 100,
    packPrice: 600,
    boxPrice: 600,
    imageUrl: '/images/El Farouk10.png',
    isNew: true,
    createdAt: new Date().toISOString(),
    categoryId: '1'
  },
  {
    id: '2',
    name: 'منتج تجريبي 1',
    productCode: '#',
    boxQuantity: 6,
    piecePrice: 6,
    packPrice: 36,
    boxPrice: 36,
    imageUrl: '/images/hea.png',
    isNew: false,
    createdAt: new Date().toISOString(),
    categoryId: '1'
  },
  {
    id: '3',
    name: 'منتج تجريبي 3',
    productCode: '@',
    boxQuantity: 11,
    piecePrice: 11,
    packPrice: 121,
    boxPrice: 121,
    imageUrl: '/images/El Farouk10.png',
    isNew: false,
    createdAt: new Date().toISOString(),
    categoryId: '2'
  },
  {
    id: '4',
    name: 'sfsgw',
    productCode: 'egeg',
    boxQuantity: 33,
    piecePrice: 33,
    packPrice: 1089,
    boxPrice: 1089,
    imageUrl: '/images/hea.png',
    isNew: true,
    createdAt: new Date().toISOString(),
    categoryId: '2'
  }
];

export default function TestOrdersPage() {
  const { orderMode, toggleOrderMode } = useCart();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">صفحة اختبار الطلبات</h1>
      
      <div className="mb-8 flex justify-center">
        <button 
          onClick={toggleOrderMode}
          className={`px-4 py-2 rounded-md ${orderMode ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {orderMode ? 'وضع الطلب مفعل' : 'تفعيل وضع الطلب'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sampleProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 