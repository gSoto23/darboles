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

interface TreeSpecies {
  id: number;
  name: string;
  scientific_name: string;
  description: string;
  price_crc: number;
  image_url: string;
  stock: number;
  is_active: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

async function getActiveTrees(): Promise<TreeSpecies[]> {
  try {
    const res = await fetch(`${API_URL}/admin/trees`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const trees: TreeSpecies[] = await res.json();
    return trees.filter((tree) => tree.is_active);
  } catch {
    return [];
  }
}

function absoluteImageUrl(imageUrl: string): string {
  if (!imageUrl) return "https://darboles.com/background-desktop.jpg";
  if (imageUrl.startsWith("http")) return imageUrl;
  return API_URL.replace("/api/v1", "") + imageUrl;
}

export default async function RegalosPage() {
  const trees = await getActiveTrees();

  const jsonLd =
    trees.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: trees.map((tree, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: tree.name,
              description: tree.description,
              image: absoluteImageUrl(tree.image_url),
              offers: {
                "@type": "Offer",
                url: "https://darboles.com/regalos",
                priceCurrency: "CRC",
                price: tree.price_crc,
                availability:
                  tree.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            },
          })),
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RegalosClient />
    </>
  );
}
