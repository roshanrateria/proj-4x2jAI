import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/AuthProvider'
import { TranslationProvider } from '@/contexts/TranslationContext'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/Toaster'
import { TranslationLoadingIndicator } from '@/components/TranslationLoadingIndicator'
import AIChatbot from '@/components/AIChatbot'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalakriti - Smart E-commerce Platform",
  description: "AI-powered e-commerce platform connecting artisans and buyers with intelligent features, real-time navigation, and seamless multilingual support.",
  keywords: ["kalakriti", "e-commerce", "artisans", "marketplace", "AI", "multilingual", "handicrafts", "traditional", "crafts"],
  authors: [{ name: "Kalakriti Team" }],
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Kalakriti - Smart E-commerce Platform",
    description: "AI-powered marketplace connecting traditional artisans with modern buyers",
    type: "website",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalakriti - Smart E-commerce Platform",
    description: "AI-powered marketplace connecting traditional artisans with modern buyers",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-orange-50 to-white min-h-screen`}
      >
        <AuthProvider>
          <TranslationProvider>
            <Navbar />
            {children}
            <AIChatbot />
            <TranslationLoadingIndicator />
            <Toaster />
          </TranslationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
