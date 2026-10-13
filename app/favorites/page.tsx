import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "My List & Watchlist",
  description: "Personalized watchlist and saved favorite titles on MyStreamFlix.",
};

export default function FavoritesPage() {
  return <ClientApp initialTab="favorites" initialContentType="all" />;
}
