'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllDeployedContracts, 
  analyzeContractById, 
  DynamicContractInfo,
  executeReadOperation,
  executeWriteOperation
} from '@/lib/contract-analyzer'
import { getPublicKey, signTransaction as walletSignTransaction } from '@/lib/stellar-wallets-kit'
import { useNetwork } from '@/contexts/NetworkContext'

export interface UseDynamicContractsState {
  contracts: DynamicContractInfo[]
  isLoading: boolean
  error: string | null
  refreshContracts: () => Promise<void>
  addContract: (contractId: string) => Promise<DynamicContractInfo | null>
  callReadMethod: (contractName: string, methodName: string, args?: Record<string, any>) => Promise<any>
  callWriteMethod: (contractName: string, methodName: string, args?: Record<string, any>) => Promise<any>
}

export function useDynamicContracts(): UseDynamicContractsState {
  const { network, contractIds, rpcUrl, networkPassphrase } = useNetwork()
  const [contracts, setContracts] = useState<DynamicContractInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadContracts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const deployedContracts = await getAllDeployedContracts(network)
      setContracts(deployedContracts)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contracts'
      setError(errorMessage)
      console.error('Error loading contracts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [network])

  const refreshContracts = useCallback(async () => {
    await loadContracts()
  }, [loadContracts])

  const addContract = useCallback(async (contractId: string): Promise<DynamicContractInfo | null> => {
    try {
      setError(null)
      
      // Check if contract already exists
      const existingContract = contracts.find(c => c.contractId === contractId)
      if (existingContract) {
        return existingContract
      }

      // Analyze the new contract
      const contractInfo = await analyzeContractById(contractId)
      if (contractInfo) {
        setContracts(prev => [...prev, contractInfo])
        return contractInfo
      }
      
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contract'
      setError(errorMessage)
      console.error('Error adding contract:', err)
      return null
    }
  }, [contracts])

  // Execute a read method (no wallet required)
  const callReadMethod = useCallback(async (
    contractName: string,
    methodName: string,
    args: Record<string, any> = {}
  ): Promise<any> => {
    try {
      setError(null)
      const contractId = contractIds[contractName.toLowerCase()]
      
      if (!contractId) {
        throw new Error(`Contract "${contractName}" not found on ${network}. Available contracts: ${Object.keys(contractIds).join(', ')}`)
      }
      
      const result = await executeReadOperation(
        contractName, 
        methodName, 
        args,
        network,
        contractId,
        rpcUrl,
        networkPassphrase
      )
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute read operation'
      setError(errorMessage)
      console.error('Error calling read method:', err)
      throw err
    }
  }, [contractIds, network, rpcUrl, networkPassphrase])

  // Execute a write method (requires wallet)
  const callWriteMethod = useCallback(async (
    contractName: string,
    methodName: string,
    args: Record<string, any> = {}
  ): Promise<any> => {
    try {
      setError(null)
      
      // Get wallet info
      const publicKey = await getPublicKey()
      if (!publicKey) {
        throw new Error('Please connect your wallet first')
      }

      const contractId = contractIds[contractName.toLowerCase()]

      // Use signTransaction directly (CosmoUI pattern)
      const result = await executeWriteOperation(
        contractName,
        methodName,
        args,
        publicKey,
        walletSignTransaction,
        network,
        contractId,
        rpcUrl,
        networkPassphrase
      )
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute write operation'
      setError(errorMessage)
      console.error('Error calling write method:', err)
      throw err
    }
  }, [contractIds, network, rpcUrl, networkPassphrase])

  useEffect(() => {
    loadContracts()
  }, [loadContracts, network])

  return {
    contracts,
    isLoading,
    error,
    refreshContracts,
    addContract,
    callReadMethod,
    callWriteMethod
  }
}
