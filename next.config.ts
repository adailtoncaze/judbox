/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",        // local onde o service worker será gerado
  register: true,        // registra automaticamente o SW
  skipWaiting: true,     // atualiza automaticamente novas versões
  disable: process.env.NODE_ENV === "development", // ativa apenas em produção
  buildExcludes: [/middleware-manifest\.json$/],   // evita conflitos no build
})

const nextConfig = {
  reactStrictMode: true, // mantém boas práticas no React
  swcMinify: true,       // minificação mais rápida com SWC

  eslint: {
    // 🚫 Ignora erros e warnings do ESLint durante o build (ex: Vercel)
    ignoreDuringBuilds: true,
  },

  experimental: {
    // 🔮 Caso esteja usando App Router (Next.js 13+)
    appDir: true,
  },
}

// 🔧 Exporta com suporte PWA sem perder suas configs
module.exports = withPWA(nextConfig)

