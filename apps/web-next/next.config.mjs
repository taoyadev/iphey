import createMDX from '@next/mdx';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages
  output: 'export',
  // Include shared contracts under src/ without inferring the runtime user's home.
  turbopack: { root: fileURLToPath(new URL('../../', import.meta.url)) },

  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],

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
              destination: 'http://localhost:8787/api/:path*',
            },
          ];
        },
      }
    : {}),
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
