import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

interface CastPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CastPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Cast Details | MyStreamFlix`,
    description: `Explore actor filmography and biography on MyStreamFlix.`,
  };
}

export default async function CastPage({ params }: CastPageProps) {
  const { id } = await params;
  return <ClientApp initialTab="cast" initialCastId={id} />;
}
