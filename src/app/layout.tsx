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
  title: {
    template: "%s | Darboles",
    default: "Darboles | Reconexión Ambiental",
  },
  description: "Plataforma de impacto ambiental y reconexión con la naturaleza. Regala vida, siembra un árbol con empaques degradables.",
  keywords: ["árboles", "reconexión ambiental", "regalos ecológicos", "sostenibilidad", "costa rica", "medio ambiente", "siembra un árbol"],
  openGraph: {
    title: "Darboles | Reconexión Ambiental",
    description: "Plataforma de impacto ambiental y reconexión con la naturaleza. Regala vida, siembra un árbol.",
    url: "https://darboles.com",
    siteName: "Darboles",
    images: [
      {
        url: "/logobk.jpeg",
        width: 1200,
        height: 630,
        alt: "Darboles Regalo de Vida",
      },
    ],
    locale: "es_CR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Darboles | Reconexión Ambiental",
    description: "Regala vida, siembra un árbol con empaques degradables de Darboles.",
    images: ["/logobk.jpeg"],
  },
  icons: {
    icon: [
      { url: "/images/fav/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/fav/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/fav/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/images/fav/favicon.ico" },
    ],
    apple: [
      { url: "/images/fav/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/images/fav/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/images/fav/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/images/fav/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/images/fav/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/images/fav/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/images/fav/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/images/fav/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/images/fav/apple-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "manifest",
        url: "/images/fav/manifest.json",
      },
    ],
  },
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
