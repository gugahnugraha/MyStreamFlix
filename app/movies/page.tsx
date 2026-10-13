import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "Movies Catalog",
  description: "Explore our handpicked curation of blockbusters, documentaries, and animations in cinematic 4K HDR quality.",
};

export default function MoviesPage() {
  return <ClientApp initialTab="home" initialContentType="movie" />;
}
