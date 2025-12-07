import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Team Auction",
  description: "Professional sports team auction application for live events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

