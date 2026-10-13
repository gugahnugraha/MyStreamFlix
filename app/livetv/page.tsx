import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "Live TV Stations & Broadcasts",
  description: "Watch live television channels, news broadcasts, sports, and entertainment streams in high definition.",
};

export default function LiveTvPage() {
  return <ClientApp initialTab="home" initialContentType="livetv" />;
}
