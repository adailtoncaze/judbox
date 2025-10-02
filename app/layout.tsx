import "./globals.css"
import { Inter } from "next/font/google"
import { ToastProvider } from "@/hooks/useToast"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "JudBox",
  description: "Sistema de Inventário de Arquivos Físicos",
  icons: {
    icon: "/favicon.svg", // garante que usa o favicon da pasta public
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
