/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone',
    reactStrictMode: true,
    swcMinify: true,

    // Proxy API requests to backend in development
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/api/:path*',
            },
            {
                source: '/downloads/:path*',
                destination: 'http://localhost:8000/downloads/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
