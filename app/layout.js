// app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import ToastProvider from '@/components/ToastProvider';

export const metadata = {
  title: 'LUXE Parfums — Premium Fragrance Collection',
  description: 'Discover the world\'s most exquisite perfumes. Oud royals, floral bouquets, citrus freshness — your signature scent awaits.',
  keywords: 'luxury perfumes, oud, fragrances, premium scents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <CartSidebar />
              {children}
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
