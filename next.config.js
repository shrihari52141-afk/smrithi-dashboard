/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This explicitly tells Next.js to skip type-checking and build anyway
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
