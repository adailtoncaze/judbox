/** @type {import('next').NextConfig} */
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

module.exports = nextConfig
