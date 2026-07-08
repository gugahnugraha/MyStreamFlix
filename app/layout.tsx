import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlixSphere - Premium Movie Streaming CMS & Portal",
  description: "Watch movies, TV series, anime, and documentations online in pristine 4K quality with dynamic subtitle capabilities.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div id="app-root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
