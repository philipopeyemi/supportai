/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["unpdf", "mammoth"],
  },
};

module.exports = nextConfig;
