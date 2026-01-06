/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Enable edge runtime for API routes
    // This allows deployment to Vercel Edge Functions
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
