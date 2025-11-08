import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiThemeProvider from "@/components/MuiThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import EmotionRegistry from "@/components/EmotionRegistry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boutique Admin",
  description: "Sistema de administración para boutique de ropa femenina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <EmotionRegistry>
          <MuiThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MuiThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
