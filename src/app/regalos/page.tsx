import type { Metadata } from "next";
import RegalosClient from "./RegalosClient";

export const metadata: Metadata = {
  title: "Regala un árbol",
  description: "Arma tu carrito botánico: regala distintas especies de árboles a una o varias personas en Costa Rica, cada una con certificado único y trazabilidad real.",
  alternates: {
    canonical: "/regalos",
  },
  openGraph: {
    title: "Regala un árbol | Darboles",
    description: "Arma tu carrito botánico: regala distintas especies de árboles a una o varias personas en Costa Rica, cada una con certificado único y trazabilidad real.",
    url: "https://darboles.com/regalos",
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
    title: "Regala un árbol | Darboles",
    description: "Arma tu carrito botánico: regala distintas especies de árboles a una o varias personas en Costa Rica, cada una con certificado único y trazabilidad real.",
    images: ["/background-desktop.jpg"],
  },
};

export default function RegalosPage() {
  return <RegalosClient />;
}
