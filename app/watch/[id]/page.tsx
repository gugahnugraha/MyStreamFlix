import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Streaming Player | MyStreamFlix`,
    description: `Watch movie and series with subtitles, audio selection, and adaptive streaming on MyStreamFlix.`,
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  return <ClientApp initialWatchId={id} />;
}
