"use client";

import { usePathname } from "next/navigation";

export default function WhatsAppButton() {
    const pathname = usePathname();
    const phone = "524426067589";

    let message = "Hola, necesito ayuda de un Asesor LibroLoop";

    if (pathname.startsWith("/catalogo")) {
        message = "Hola, tengo dudas sobre un libro del catálogo, ¿me ayuda un Asesor LibroLoop?";
    } else if (pathname.startsWith("/vender")) {
        message = "Hola, quiero vender mis libros, ¿me ayuda un Asesor LibroLoop?";
    }

    const url = `https://wa.me/${phone}?text=${(message)}`;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem",
                zIndex: 100,
            }}
        >
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "56px",
                    height: "56px",
                    backgroundColor: "#25D366",
                    color: "white",
                    borderRadius: "50%",
                    textDecoration: "none",
                    fontWeight: 700,
                }}
            >
                {/* Icono oficial */}
                <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="white"
                >
                    <path d="M20.52 3.48A11.9 11.9 0 0 0 12.06 0C5.52 0 .24 5.28.24 11.82c0 2.08.54 4.1 1.56 5.88L0 24l6.48-1.68a11.9 11.9 0 0 0 5.58 1.44h.06c6.54 0 11.82-5.28 11.82-11.82 0-3.16-1.2-6.14-3.42-8.46zM12.12 21.6h-.06a9.8 9.8 0 0 1-4.98-1.38l-.36-.18-3.84 1 1.02-3.72-.24-.36a9.72 9.72 0 0 1-1.5-5.22c0-5.4 4.38-9.78 9.78-9.78 2.64 0 5.1 1.02 6.96 2.88a9.72 9.72 0 0 1 2.82 6.9c0 5.4-4.38 9.78-9.78 9.78zm5.4-7.32c-.3-.18-1.8-.9-2.1-1.02-.3-.12-.48-.18-.66.18-.18.36-.72 1.02-.9 1.2-.18.18-.36.18-.66.06-.3-.18-1.26-.48-2.4-1.56-.9-.78-1.5-1.74-1.68-2.04-.18-.3 0-.48.12-.66.12-.12.3-.3.42-.48.12-.18.18-.3.3-.48.12-.18.06-.36 0-.48-.06-.12-.66-1.62-.9-2.22-.24-.6-.48-.54-.66-.54h-.54c-.18 0-.48.06-.72.3-.24.24-.96.96-.96 2.34s.96 2.7 1.08 2.88c.12.18 1.86 2.82 4.5 3.96.66.3 1.2.48 1.62.6.66.18 1.26.18 1.74.12.54-.06 1.8-.72 2.04-1.44.24-.72.24-1.32.18-1.44-.06-.12-.24-.18-.54-.36z" />
                </svg>
            </a>

            <style jsx>{`
        @keyframes pulseWhatsApp {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
}