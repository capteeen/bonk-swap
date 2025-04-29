/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'ipfs.io',
      'raw.githubusercontent.com',
      'solana-gateway.moralis.io',
      'api.solscan.io',
      'arweave.net',
      'metadata.degods.com',
      'bafybeidr5b5o7elvj6ompn6ckqqhnidpwokdxuavbmntcj2w3wb3hsaxdy.ipfs.dweb.link'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
