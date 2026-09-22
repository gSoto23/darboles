import type { Metadata } from "next";
import EmpresasClient from "./EmpresasClient";

export const metadata: Metadata = {
  title: "Programa Corporativo",
  description: "Programa corporativo e institucional de Dárboles: inversión ambiental medible y auditable para reportes de sostenibilidad ESG y compensación de emisiones en Costa Rica.",
  alternates: {
    canonical: "/empresas",
  },
  openGraph: {
    title: "Programa Corporativo | Darboles",
    description: "Programa corporativo e institucional de Dárboles: inversión ambiental medible y auditable para reportes de sostenibilidad ESG y compensación de emisiones en Costa Rica.",
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
    description: "Programa corporativo e institucional de Dárboles: inversión ambiental medible y auditable para reportes de sostenibilidad ESG y compensación de emisiones en Costa Rica.",
    images: ["/background-desktop.jpg"],
  },
};

export default function EmpresasPage() {
  return <EmpresasClient />;
}
