import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Lato for headings
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

// JetBrains Mono for monospace sections
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Drid Admin Portal",
    default: "Email Campaign & Unit Management System",
  },
  description:
    "Drid Admin Portal for managing email campaigns and user units.",
  keywords: [
    "Admin",
    "Email Campaign",
    "Unit Management",
    "User Management",
  ],
  openGraph: {
    title: "Email Campaign & Unit Management System",
    description:
      "Drid Admin Portal for managing email campaigns and user units.",
    url: "https://your-domain.com", // Placeholder, update if a specific domain is known
    siteName: "Drid Admin Portal",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
