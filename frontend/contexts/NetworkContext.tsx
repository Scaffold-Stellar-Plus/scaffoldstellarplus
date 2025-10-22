'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type NetworkType = 'testnet' | 'mainnet' | 'futurenet'

interface NetworkContextType {
  network: NetworkType
  setNetwork: (network: NetworkType) => void
  contractIds: Record<string, string>
  rpcUrl: string
  networkPassphrase: string
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

interface NetworkProviderProps {
  children: ReactNode
}

// Network configurations
const NETWORK_CONFIGS = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    networkPassphrase: 'Test SDF Network ; September 2015'
  },
  mainnet: {
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    networkPassphrase: 'Public Global Stellar Network ; September 2015'
  },
  futurenet: {
    rpcUrl: 'https://rpc-futurenet.stellar.org:443',
    networkPassphrase: 'Test SDF Future Network ; October 2022'
  }
}

// Load deployment files for different networks
const loadDeploymentFile = async (network: NetworkType): Promise<Record<string, string>> => {
  try {
    // Try to load network-specific deployment file
    const fileName = network === 'testnet' ? 'deployment.json' : `deployment-${network}.json`
    const response = await fetch(`/${fileName}`)
    
    if (!response.ok) {
      return {}
    }
    
    const data = await response.json()
    const contractIds: Record<string, string> = {}
    
    // Extract contract IDs from deployment file
    if (data.contracts) {
      Object.entries(data.contracts).forEach(([name, info]: [string, any]) => {
        contractIds[name] = info.contractId
      })
    }
    
    return contractIds
  } catch (error) {
    console.error(`Failed to load deployment file for ${network}:`, error)
    return {}
  }
}

// Load environment variables for current network
const loadNetworkEnv = (network: NetworkType): Record<string, string> => {
  const contractIds: Record<string, string> = {}
  
  // Only access process.env if available (server-side)
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    // Get all environment variables
    const env = process.env
    
    // Filter for contract IDs
    Object.keys(env).forEach((key) => {
      if (key.startsWith('NEXT_PUBLIC_') && key.endsWith('_CONTRACT_ID')) {
        const contractName = key
          .replace('NEXT_PUBLIC_', '')
          .replace('_CONTRACT_ID', '')
          .toLowerCase()
        const value = env[key]
        if (value) {
          contractIds[contractName] = value
        }
      }
    })
  }
  
  return contractIds
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  // Initialize from environment or localStorage
  const [network, setNetworkState] = useState<NetworkType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stellar-network')
      if (saved && ['testnet', 'mainnet', 'futurenet'].includes(saved)) {
        return saved as NetworkType
      }
    }
    return (process.env.NEXT_PUBLIC_STELLAR_NETWORK as NetworkType) || 'testnet'
  })
  
  const [contractIds, setContractIds] = useState<Record<string, string>>({})

  // Load contract IDs when network changes
  useEffect(() => {
    const loadContracts = async () => {
      // Try to load from deployment file first
      const deploymentContracts = await loadDeploymentFile(network)
      
      // Fallback to environment variables
      const envContracts = loadNetworkEnv(network)
      
      // Merge both sources (deployment file takes precedence)
      const merged = { ...envContracts, ...deploymentContracts }
      
      setContractIds(merged)
    }
    
    loadContracts()
  }, [network])

  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('stellar-network', newNetwork)
    }
  }

  const config = NETWORK_CONFIGS[network]

  const value: NetworkContextType = {
    network,
    setNetwork,
    contractIds,
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}

