/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },

  // API rewrite only for local development
  // In production, use NEXT_PUBLIC_API_URL environment variable
  ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'development'
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:4310/api/:path*',
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
