/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // enables slim Docker builds
  eslint: {
    // Allow production builds to complete even with ESLint warnings/errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
