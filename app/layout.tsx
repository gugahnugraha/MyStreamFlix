import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mystreamflix.biz.id"),
  title: {
    default: "MyStreamFlix - Movies, Series, and Live TV",
    template: "%s | MyStreamFlix",
  },
  description: "Stream movies, TV series, and live TV channels with responsive playback, profiles, watchlists, and admin CMS controls.",
  keywords: ["streaming", "movies", "series", "live tv", "iptv", "MyStreamFlix"],
  applicationName: "MyStreamFlix",
  authors: [{ name: "MyStreamFlix" }],
  creator: "MyStreamFlix",
  publisher: "MyStreamFlix",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "MyStreamFlix",
    title: "MyStreamFlix - Movies, Series, and Live TV",
    description: "Stream movies, TV series, and live TV channels in one responsive entertainment portal.",
    url: "https://mystreamflix.biz.id",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyStreamFlix - Movies, Series, and Live TV",
    description: "Responsive streaming portal for movies, series, and live TV.",
  },
  icons: {
    icon: "/favicon.ico"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#00ADB5",
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
