
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/motion/MotionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EYVA: Smart Study Companion",
  description:
    "Stay gently aware of drowsiness while you study, take restorative breaks on time, and build steady focus habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-pt-24 antialiased`}>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
