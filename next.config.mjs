/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.fynd.com'], // Allow images to be optimized from the external domain 'cdn.fynd.com'
  },
  distDir: 'public/build', // Change the build directory to 'public/build' instead of the default '.next'
};

export default nextConfig;
