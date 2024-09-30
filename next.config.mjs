/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.fynd.com'],  // Add your external domain here
  },
  distDir: 'public/build', // Change the build directory to 'build' instead of the default '.next'
  async rewrites() {
        return [
          {
            source: '/fp/install', // Custom route without /api
            destination: '/api/fp/install', // Points to the actual API route
          },
        ]
    }
};

export default nextConfig;
