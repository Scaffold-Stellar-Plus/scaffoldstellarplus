import contractMetadata from './contract-metadata.json'
import { rpcUrl } from '@/contracts/util'
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

// Get contract client instance for a given contract name
export const getContractClient = async (contractName: string): Promise<any> => {
  try {
    // Use auto-generated contract map (from generate-contract-imports.js)
    const loader = contractMap[contractName] || contractMap[contractName.toLowerCase()]
    if (!loader) {
      throw new Error(`No contract module found for: ${contractName}`)
    }

    const module = await loader()
    return module.default
  } catch (error) {
    console.error(`Error loading contract ${contractName}:`, error)
    throw error
  }
}

// Execute a read operation on a contract (no wallet needed)
export const executeReadOperation = async (
  contractName: string,
  methodName: string,
  args: Record<string, any> = {}
): Promise<any> => {
  try {
    const client = await getContractClient(contractName)
    
    // Call the method on the client
    const result = await client[methodName](args)
    
    // Handle different result formats
    if (result && typeof result === 'object' && 'result' in result) {
      return result.result
    }
    
    return result
  } catch (error) {
    console.error(`Error executing read operation ${methodName} on ${contractName}:`, error)
    throw error
  }
}

// Execute a write operation on a contract (requires wallet)
export const executeWriteOperation = async (
  contractName: string,
  methodName: string,
  args: Record<string, any> = {},
  publicKey: string,
  signTransaction: (xdr: string, opts?: any) => Promise<any>
): Promise<any> => {
  try {
    const client = await getContractClient(contractName)
    
    // Set wallet options on the client (CosmoUI pattern)
    client.options.publicKey = publicKey
    client.options.signTransaction = signTransaction
    
    // Call the method - this returns a transaction object
    const tx = await client[methodName](args)
    
    // Sign and send the transaction (CosmoUI pattern)
    const { result } = await tx.signAndSend()
    
    return result
  } catch (error) {
    console.error('Error executing write operation:', error)
    throw error
  }
}

// Get all deployed contracts from metadata
export const getAllDeployedContracts = async (): Promise<DynamicContractInfo[]> => {
  const contracts: DynamicContractInfo[] = []
  
  // Get contracts from metadata
  const metadataContracts = Object.values(contractMetadata.contracts || {})
  
  // Add metadata contracts
  for (const contract of metadataContracts) {
    if (contract.contractId) {
      contracts.push({
        contractId: contract.contractId,
        name: contract.name,
        description: (contract as any).description || `Contract ${contract.contractId.slice(0, 8)}...`,
        methods: (contract.methods || []).map((method: any) => ({
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
        isStateful: contract.isStateful || false,
        hasReadMethods: contract.hasReadMethods || false,
        hasWriteMethods: contract.hasWriteMethods || false,
        totalMethods: contract.methods?.length || 0
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
