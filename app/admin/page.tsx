import type { Metadata } from "next";
import ClientApp from "@/src/ClientApp";

export const metadata: Metadata = {
  title: "Admin CMS Dashboard",
  description: "Administrative console and content management system for MyStreamFlix.",
};

export default function AdminPage() {
  return <ClientApp initialTab="admin" initialContentType="all" />;
}
