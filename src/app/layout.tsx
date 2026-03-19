import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ResearchAgent — AI-Powered Company Research",
  description:
    "Enter any company name and let our autonomous AI agent research it from scratch — browsing the web, pulling financial data, reading news, and generating a structured investment brief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased selection:bg-primary/20`}>
        {children}
      </body>
    </html>
  );
}
