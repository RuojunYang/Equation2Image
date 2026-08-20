import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equation2Image",
  description: "Turn mathematical functions into AI-generated art",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
