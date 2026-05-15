import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoSocio | Élite Automotriz",
  description:
    "Gestión inteligente del equipo de mantenimiento de flotillas para pequeñas, medianas y grandes empresas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <header className="bg-marca text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              AutoSocio <span className="text-marca-acento">| Élite Automotriz</span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-marca-acento">
                Empresas
              </Link>
              <Link href="/planes" className="hover:text-marca-acento">
                Planes
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
