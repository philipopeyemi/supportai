/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfreader", "mammoth"],
  },
};

module.exports = nextConfig;
