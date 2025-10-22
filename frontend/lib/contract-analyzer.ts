import contractMetadata from './contract-metadata.json'
import { contractMap } from './contract-map'

export interface ContractMethod {
  name: string
  parameters: ContractParameter[]
  returnType: string
  isReadOnly: boolean
  description?: string
}

export interface ContractParameter {
  name: string
  type: string
  required: boolean
  description?: string
}

export interface DynamicContractInfo {
  contractId: string
  name: string
  description: string
  methods: ContractMethod[]
  isStateful: boolean
  hasReadMethods: boolean
  hasWriteMethods: boolean
  totalMethods: number
}

export interface ContractAnalysis {
  name: string
  methods: ContractMethod[]
  isStateful: boolean
  hasReadMethods: boolean
  hasWriteMethods: boolean
  totalMethods: number
  contractId: string
}

// Get contract client instance for a given contract name with network support
export const getContractClient = async (
  contractName: string, 
  network: string,
  contractId?: string,
  rpcUrl?: string,
  networkPassphrase?: string
): Promise<any> => {
  try {
    // Build network-specific contract key
    const contractKey = `${contractName}-${network}`
    
    // Use auto-generated contract map (from generate-contract-imports.js)
    const loader = contractMap[contractKey] || contractMap[contractKey.toLowerCase()]
    if (!loader) {
      throw new Error(`No contract module found for: ${contractName} on ${network}. Make sure contract is deployed to ${network}.`)
    }

    const module = await loader()
    const client = module.default
    
    // Update client options if network parameters provided
    if (contractId) {
      client.options.contractId = contractId
    }
    if (rpcUrl) {
      client.options.rpcUrl = rpcUrl
    }
    if (networkPassphrase) {
      client.options.networkPassphrase = networkPassphrase
    }
    
    return client
  } catch (error) {
    console.error(`Error loading contract ${contractName} on ${network}:`, error)
    throw error
  }
}

// Execute a read operation on a contract (no wallet needed)
export const executeReadOperation = async (
  contractName: string,
  methodName: string,
  args: Record<string, any> = {},
  network: string = 'testnet',
  contractId?: string,
  rpcUrl?: string,
  networkPassphrase?: string
): Promise<any> => {
  try {
    const client = await getContractClient(contractName, network, contractId, rpcUrl, networkPassphrase)
    
    // Call the method on the client
    const result = await client[methodName](args)
    
    // Handle different result formats
    if (result && typeof result === 'object' && 'result' in result) {
      return result.result
    }
    
    return result
  } catch (error) {
    console.error(`Error executing read operation ${methodName} on ${contractName} (${network}):`, error)
    throw error
  }
}

// Execute a write operation on a contract (requires wallet)
export const executeWriteOperation = async (
  contractName: string,
  methodName: string,
  args: Record<string, any> = {},
  publicKey: string,
  signTransaction: (xdr: string, opts?: any) => Promise<any>,
  network: string = 'testnet',
  contractId?: string,
  rpcUrl?: string,
  networkPassphrase?: string
): Promise<any> => {
  try {
    const client = await getContractClient(contractName, network, contractId, rpcUrl, networkPassphrase)
    
    // Set wallet options on the client (CosmoUI pattern)
    client.options.publicKey = publicKey
    client.options.signTransaction = signTransaction
    
    // Call the method - this returns a transaction object
    const tx = await client[methodName](args)
    
    // Sign and send the transaction (CosmoUI pattern)
    const { result } = await tx.signAndSend()
    
    return result
  } catch (error) {
    console.error(`Error executing write operation on ${contractName} (${network}):`, error)
    throw error
  }
}

// Get all deployed contracts from metadata for a specific network
export const getAllDeployedContracts = async (network: string = 'testnet'): Promise<DynamicContractInfo[]> => {
  const contracts: DynamicContractInfo[] = []
  
  // Get contracts from metadata for the specific network
  const networkContracts = (contractMetadata.contracts as any)?.[network] || {}
  const metadataContracts = Object.values(networkContracts)
  
  // Add metadata contracts
  for (const contract of metadataContracts) {
    if ((contract as any).contractId) {
      const c = contract as any
      contracts.push({
        contractId: c.contractId,
        name: c.name,
        description: c.description || `Contract ${c.contractId.slice(0, 8)}...`,
        methods: (c.methods || []).map((method: any) => ({
          name: method.name,
          parameters: method.parameters.map((param: any) => ({
            name: param.name,
            type: param.type,
            required: true,
            description: undefined
          })),
          returnType: method.returnType,
          isReadOnly: method.isReadOnly,
          description: method.description
        })),
        isStateful: c.isStateful || false,
        hasReadMethods: c.hasReadMethods || false,
        hasWriteMethods: c.hasWriteMethods || false,
        totalMethods: c.methods?.length || 0
      })
    }
  }

  return contracts
}

// Simplified function to analyze any contract by ID
export const analyzeContractById = async (contractId: string): Promise<DynamicContractInfo | null> => {
  // Simplified version that doesn't require Stellar SDK
  // For now, return a basic contract info without dynamic analysis
  return {
    contractId,
    name: `Contract ${contractId.slice(0, 8)}...`,
    description: `Contract ${contractId.slice(0, 8)}...`,
    methods: [], // Will be populated from metadata if available
    isStateful: false,
    hasReadMethods: false,
    hasWriteMethods: false,
    totalMethods: 0
  }
}

// Export analyzeContract for backward compatibility
export const analyzeContract = analyzeContractById
