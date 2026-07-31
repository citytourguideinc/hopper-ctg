/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Driver dashboard — never CDN-cache; chunk hashes change on every deploy
        source: '/driver',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        // Rider request/status pages — same reason
        source: '/request/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
};
module.exports = nextConfig;