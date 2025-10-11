/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "lh3.googleusercontent.com",
      "firebasestorage.googleapis.com",
      "avatars.githubusercontent.com",
    ],
  },
};

export default nextConfig;
