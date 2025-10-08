/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org:443',
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    NEXT_PUBLIC_HELLO_WORLD_CONTRACT_ID: process.env.NEXT_PUBLIC_HELLO_WORLD_CONTRACT_ID || 'CCQ6K2MLYRMPNRCCGOK47Y4D5NWMETT2JKLES5OUVXQBVOJFVKQVHI3Z',
    NEXT_PUBLIC_INCREMENT_CONTRACT_ID: process.env.NEXT_PUBLIC_INCREMENT_CONTRACT_ID || 'CB53AAYGW3JUTRIIEQTPTP4WK4EGMXRGNTWZJFGGRFLQZG7DBNNT7CPG',
    NEXT_PUBLIC_TOKEN_CONTRACT_ID: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID || 'CD3JMDATDD35ML5CATCGV7UZI5NHQTH6BLNXZRDWHFZYWD767ARD4K7N',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },
}

export default nextConfig
