/** @type {import('next').NextConfig} */
// Disable TLS temporarily
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qzsdrlumdalcnywlgcus.supabase.co",
        port: "",
        pathname: "/*/**",
      },
    ],
  },
};

module.exports = nextConfig;
