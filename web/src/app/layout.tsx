import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Films — Letterboxd dashboard",
  description: "A personal dashboard of my Letterboxd film diary.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted">
          Built from my Letterboxd data export. Not affiliated with Letterboxd.
          <br />
          Film details and posters from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
          Streaming availability data by JustWatch.
        </footer>
      </body>
    </html>
  );
}
