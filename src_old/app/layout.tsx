import type { Metadata } from "next";
import "@/assets/css/globals.css";

export const metadata: Metadata = {
  title: "Dungeon Monster Isekai",
  description: "",
};



export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html
      lang="it"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
