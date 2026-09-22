import type { Metadata } from "next";
import NosotrosClient from "./NosotrosClient";

export const metadata: Metadata = {
  title: "Sobre Dárboles",
  description: "Dárboles nace para reconectar a las personas a través del regalo más elemental: un árbol nativo vivo, entregado directamente en las manos de quien amas.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Sobre Dárboles | Darboles",
    description: "Dárboles nace para reconectar a las personas a través del regalo más elemental: un árbol nativo vivo, entregado directamente en las manos de quien amas.",
    url: "https://darboles.com/nosotros",
    siteName: "Darboles",
    images: [
      {
        url: "/background-desktop.jpg",
        width: 1920,
        height: 1080,
        alt: "Cajas Dárboles con árboles recién sembrados",
      },
    ],
    locale: "es_CR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre Dárboles | Darboles",
    description: "Dárboles nace para reconectar a las personas a través del regalo más elemental: un árbol nativo vivo, entregado directamente en las manos de quien amas.",
    images: ["/background-desktop.jpg"],
  },
};

export default function NosotrosPage() {
  return <NosotrosClient />;
}
