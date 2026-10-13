"use client";

import dynamic from "next/dynamic";
import type { ContentType } from "./lib/routes";

interface ClientAppProps {
  initialTab?: string;
  initialContentType?: ContentType;
  initialCastId?: string;
}

const DynamicApp = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-2 border-[#00ADB5] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-zinc-500 font-medium">Loading MyStreamFlix...</span>
    </div>
  ),
});

export default function ClientApp({ initialTab, initialContentType, initialCastId }: ClientAppProps) {
  return <DynamicApp initialTab={initialTab} initialContentType={initialContentType} initialCastId={initialCastId} />;
}
