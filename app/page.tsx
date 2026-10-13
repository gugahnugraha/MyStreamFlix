import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "Watch Movies, Series & Live TV Online",
  description: "Stream movies, TV series, and live TV channels with responsive playback, profiles, watchlists, and admin CMS controls.",
};

export default function HomePage() {
  return <ClientApp initialTab="home" initialContentType="all" />;
}
