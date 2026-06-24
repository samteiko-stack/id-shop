import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // In dev, write build output to /tmp to avoid macOS Spotlight interfering
  // with Next.js atomic file operations inside .next/
  // In production this is omitted so the standard .next dir is used.
  ...(process.env.NODE_ENV === 'development' && { distDir: '/tmp/id-shop-next' }),

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Supabase + dev hot reload
              process.env.NODE_ENV === 'development'
                ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in ws://localhost:*"
                : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in",
              // Scripts — unsafe-inline needed for Next.js inline scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles — shadcn uses inline styles in some components
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images — allow Supabase Storage + data URIs
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
              // Video/audio
              "media-src 'self'",
              // Frames
              "frame-ancestors 'none'",
              // Base URI
              "base-uri 'self'",
              // Form action
              "form-action 'self'",
            ]
              .filter(Boolean)
              .join('; '),
          },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  experimental: {
    // Client router cache — long-lived; server data refreshes via revalidateTag on mutations.
    staleTimes: {
      dynamic: 1800,
      static: 1800,
    },
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 'localhost:3005', 'localhost:3006',
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
          : []),
      ],
    },
  },

}

export default nextConfig
