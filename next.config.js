/** @type {import('next').NextConfig} */
// Disable TLS temporarily
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig = {
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
