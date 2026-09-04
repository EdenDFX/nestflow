import type { Metadata } from "next";
import { Geist, Outfit } from "next/font/google";
import { ThemeProvider } from "@wrksz/themes/next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NestFlow",
    template: "%s · NestFlow",
  },
  description: "Plan. Assign. Deliver. Internal task management for Nest by Eden.",
  applicationName: "NestFlow",
  themeColor: "#FF6300",
  appleWebApp: {
    capable: true,
    title: "NestFlow",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
