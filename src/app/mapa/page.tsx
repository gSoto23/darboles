import type { Metadata } from "next";
import MapaClient from "./MapaClient";

export const metadata: Metadata = {
  title: "Impacto Nacional",
  description: "Explora el mapa en tiempo real de los árboles plantados por ciudadanos y organizaciones aliadas en Costa Rica, con la misma trazabilidad GPS que usa TOMATO.",
  alternates: {
    canonical: "/mapa",
  },
  openGraph: {
    title: "Impacto Nacional | Darboles",
    description: "Explora el mapa en tiempo real de los árboles plantados por ciudadanos y organizaciones aliadas en Costa Rica, con la misma trazabilidad GPS que usa TOMATO.",
    url: "https://darboles.com/mapa",
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
    title: "Impacto Nacional | Darboles",
    description: "Explora el mapa en tiempo real de los árboles plantados por ciudadanos y organizaciones aliadas en Costa Rica, con la misma trazabilidad GPS que usa TOMATO.",
    images: ["/background-desktop.jpg"],
  },
};

export default function MapaPage() {
  return <MapaClient />;
}
