import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para convertir fechas ISO a formato legible
export function formatDate(dateString: string) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('ar-EG', options);
}

// Función para formatear precios
export function formatPrice(price: number | string) {
  if (typeof price === 'string') {
    price = parseFloat(price);
  }
  
  // Manejo de errores para valores no numéricos
  if (isNaN(price)) return '0.00';
  
  return price.toFixed(2);
}

// Truncar texto con una longitud máxima
export function truncateText(text: string, maxLength: number = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

// Función para generar IDs únicos
export function generateId(length: number = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

// Determinar si estamos en un entorno de cliente o servidor
export const isClientSide = typeof window !== 'undefined'; 