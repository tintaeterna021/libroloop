import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import CartSidebar from "@/components/CartSidebar";
import SiteFooter from "@/components/SiteFooter";
import { CartProvider } from "@/lib/CartContext";

export const metadata: Metadata = {
  title: "Libroloop - Compra y Vende Libros",
  description: "El marketplace de libros de segunda mano más grande. Encuentra tu próxima lectura o vende tus libros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#F5F2E7', fontFamily: "'Montserrat', sans-serif" }}>
        <CartProvider>
          <Navigation />
          <div style={{ minHeight: 'calc(100vh - 200px)' }}>
            {children}
          </div>
          <SiteFooter />
          <CartSidebar />
        </CartProvider>
      </body>
    </html>
  );
}
