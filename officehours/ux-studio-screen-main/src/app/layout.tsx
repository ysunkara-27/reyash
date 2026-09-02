import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UX Studio Screen",
  description: "HCI Class Studio Display - Retro Edition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* CRT Scanline Overlay */}
        <div className="crt-overlay" />
      </body>
    </html>
  );
}
