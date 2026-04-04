import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Darboles | Reconexión Ambiental",
  description: "Plataforma de impacto ambiental y reconexión con la naturaleza. Regala vida, siembra un legado.",
};
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToasterProvider from "@/components/ToasterProvider";
import { cookies } from "next/headers";
import { TranslationProvider } from "@/context/TranslationContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "es";

  return (
    <html lang={locale} className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <TranslationProvider initialLocale={locale}>
          <ToasterProvider />
          <Navbar />
          {children}
          <Footer />
        </TranslationProvider>
      </body>
    </html>
  );
}
