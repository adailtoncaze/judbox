import "./globals.css"
import { Inter } from "next/font/google"
import { ToastProvider } from "@/hooks/useToast"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "JudBox",
  description: "Sistema de Inventário de Arquivos Físicos",
  manifest: "/manifest.json",
  themeColor: "#4f46e5", // cor base do JudBox (indigo)
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "JudBox",
    statusBarStyle: "default",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* 🧭 Metatags PWA adicionais (especialmente para iOS) */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JudBox" />
      </head>

      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
