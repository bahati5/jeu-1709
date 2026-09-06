/** @type {import('next').NextConfig} */
const nextConfig = {
  // Règle 5 du PRD : il est dev-devops, il ouvrira les devtools.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  // développement local depuis un autre hôte que localhost
  allowedDevOrigins: ['127.0.0.1'],
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
};
export default nextConfig;
