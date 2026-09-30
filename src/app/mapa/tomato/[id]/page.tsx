import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TomatoTreeClient from "./TomatoTreeClient";

export const metadata: Metadata = {
  title: "Árbol de un proyecto de TOMATO",
  description: "Ficha de un árbol de un proyecto de reforestación de TOMATO: especie, ubicación, estado verificado e historial de visitas.",
};

// En esta versión de Next.js, params llega como Promise
export default async function TomatoTreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,10}$/.test(id)) notFound();
  // key: al pasar de un árbol reemplazado al nuevo, la ficha empieza de cero
  return <TomatoTreeClient key={id} id={Number(id)} />;
}
