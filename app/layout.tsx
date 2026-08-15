import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CartCue",
  description: "Turn Amazon products into Instagram content.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
