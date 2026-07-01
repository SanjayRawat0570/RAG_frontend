import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise RAG",
  description: "Retrieval-augmented generation over your knowledge base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          // Set the theme attribute before paint so switching pages / reloading
          // never flashes the wrong palette.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
