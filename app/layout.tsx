import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskboard",
  description: "A small persistent task board built with Next.js and TypeScript.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
