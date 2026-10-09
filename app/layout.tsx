import type { Metadata } from "next";
import "./globals.css";
import { SpotlightProvider } from "@/components/Effects";

export const metadata: Metadata = {
  title: "Enterprise RAG — Knowledge Platform",
  description: "Secure retrieval-augmented generation over your organisation's knowledge base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Falls back to the system UI font when offline. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700&display=swap" />
        <script
          // Set the theme attribute before paint so switching pages / reloading
          // never flashes the wrong palette.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){}`,
          }}
        />
      </head>
      <body>
        <SpotlightProvider />
        {children}
      </body>
    </html>
  );
}
