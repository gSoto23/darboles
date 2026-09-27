import type { Metadata } from "next";
import EmpresasClient from "./EmpresasClient";

export const metadata: Metadata = {
  title: "Programa Corporativo",
  description: "Programa corporativo e institucional de Dárboles: regalo corporativo y reforestación con trazabilidad en Costa Rica: cada árbol registrado en un mapa georreferenciado.",
  alternates: {
    canonical: "/empresas",
  },
  openGraph: {
    title: "Programa Corporativo | Darboles",
    description: "Programa corporativo e institucional de Dárboles: regalo corporativo y reforestación con trazabilidad en Costa Rica: cada árbol registrado en un mapa georreferenciado.",
    url: "https://darboles.com/empresas",
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
    title: "Programa Corporativo | Darboles",
    description: "Programa corporativo e institucional de Dárboles: regalo corporativo y reforestación con trazabilidad en Costa Rica: cada árbol registrado en un mapa georreferenciado.",
    images: ["/background-desktop.jpg"],
  },
};

export default function EmpresasPage() {
  return <EmpresasClient />;
}
