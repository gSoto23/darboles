import type { Metadata } from "next";
import NosotrosClient from "./NosotrosClient";

export const metadata: Metadata = {
  title: "Sobre Dárboles",
  description: "Dárboles: regalá un árbol nativo vivo en un empaque 100% plantable — no se desempaca, se siembra completo y se desintegra orgánicamente en la tierra.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Sobre Dárboles | Darboles",
    description: "Dárboles: regalá un árbol nativo vivo en un empaque 100% plantable — no se desempaca, se siembra completo y se desintegra orgánicamente en la tierra.",
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
    description: "Dárboles: regalá un árbol nativo vivo en un empaque 100% plantable — no se desempaca, se siembra completo y se desintegra orgánicamente en la tierra.",
    images: ["/background-desktop.jpg"],
  },
};

export default function NosotrosPage() {
  return <NosotrosClient />;
}
