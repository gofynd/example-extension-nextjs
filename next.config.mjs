/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.fynd.com'], // Add your external domain here
  },
  distDir: 'public/build', // Change the build directory to 'public/build' instead of the default '.next'
};

export default nextConfig;
