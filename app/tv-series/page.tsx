import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "TV Series Collection",
  description: "Engage with stunning multi-season storytelling structures, episodic play, and subtitle overlays.",
};

export default function TvSeriesAliasPage() {
  return <ClientApp initialTab="home" initialContentType="series" />;
}
