import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Watch Movie | MyStreamFlix`,
    description: `Stream titles, view cast, and watch trailers on MyStreamFlix.`,
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  return <ClientApp initialMovieId={id} />;
}
