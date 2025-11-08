/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Algorand API Routes - Dynamic Transfer System
      {
        source: '/api/create-dynamic-transfer',
        destination: '/Algorand/Algo-smart/api/create-dynamic-transfer'
      },
      {
        source: '/api/manage-escrow',
        destination: '/Algorand/Algo-smart/api/manage-escrow'
      },
      {
        source: '/api/create-transfer',
        destination: '/Algorand/Algo-smart/api/create-transfer'
      },
      {
        source: '/api/reclaim-funds',
        destination: '/Algorand/Algo-smart/api/reclaim-funds'
      },
      {
        source: '/api/release-funds',
        destination: '/Algorand/Algo-smart/api/release-funds'
      },
      {
        source: '/api/transfer-status',
        destination: '/Algorand/Algo-smart/api/transfer-status'
      },
      {
        source: '/api/register-user',
        destination: '/Algorand/Algo-smart/api/register-user'
      },
      
      // Algorand Wallet API Routes
      {
        source: '/api/algorand/check-address',
        destination: '/Algorand/api/check-address'
      },
      {
        source: '/api/algorand/import-wallet',
        destination: '/Algorand/api/import-wallet'
      },
      {
        source: '/api/algorand/load-wallet-data',
        destination: '/Algorand/api/load-wallet-data'
      },
      {
        source: '/api/algorand/save-wallet-data',
        destination: '/Algorand/api/save-wallet-data'
      },
      {
        source: '/api/algorand/validate-mnemonic',
        destination: '/Algorand/api/validate-mnemonic'
      }
    ];
  },
  
  // Additional optimizations for large projects
  experimental: {
    optimizePackageImports: ['algosdk'],
  },
  
  // Enable source maps for better debugging
  productionBrowserSourceMaps: false,
  
  // Optimize for large codebases
  swcMinify: true,
  
  // Configure headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;