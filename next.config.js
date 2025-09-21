/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'via.placeholder.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com'
    ],
  },
  experimental: {
    serverActions: {},
  },
  // No custom Next.js config needed for the single domain approach
  // Port is configured in server.mjs
}

module.exports = nextConfig
