export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org:443"
export const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015"

// Re-export for easy access
export { rpcUrl as rpc, networkPassphrase as passphrase }
