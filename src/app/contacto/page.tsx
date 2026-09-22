import type { Metadata } from "next";
import ContactoClient from "./ContactoClient";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contáctanos para resolver dudas sobre regalos de árboles, alianzas corporativas o programas institucionales de Dárboles en Costa Rica.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto | Darboles",
    description: "Contáctanos para resolver dudas sobre regalos de árboles, alianzas corporativas o programas institucionales de Dárboles en Costa Rica.",
    url: "https://darboles.com/contacto",
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
    title: "Contacto | Darboles",
    description: "Contáctanos para resolver dudas sobre regalos de árboles, alianzas corporativas o programas institucionales de Dárboles en Costa Rica.",
    images: ["/background-desktop.jpg"],
  },
};

export default function ContactoPage() {
  return <ContactoClient />;
}
