'use client'

import { ConnectWallet } from '@/components/ConnectWallet'
import { Header } from '@/components/Header'
import { ContractMethodExecutor } from '@/components/ContractMethodExecutor'
import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useWallet } from '@/hooks/useWallet'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'


export default function ContractsPage() {
  const { contracts, isLoading, error, refreshContracts, addContract, callReadMethod, callWriteMethod } = useDynamicContracts()
  const { isConnected } = useWallet()
  const [newContractId, setNewContractId] = useState('')
  const [isAddingContract, setIsAddingContract] = useState(false)
  const [selectedContract, setSelectedContract] = useState<number>(0)

  const handleAddContract = async () => {
    if (!newContractId.trim()) return
    
    setIsAddingContract(true)
    try {
      const contract = await addContract(newContractId.trim())
      if (contract) {
        setNewContractId('')
      }
    } finally {
      setIsAddingContract(false)
    }
  }

  // Handle method execution based on whether it's read or write
  const handleMethodExecute = useCallback(async (
    contractName: string,
    methodName: string,
    isReadOnly: boolean,
    args: Record<string, any>
  ) => {
    if (isReadOnly) {
      return await callReadMethod(contractName, methodName, args)
    } else {
      return await callWriteMethod(contractName, methodName, args)
    }
  }, [callReadMethod, callWriteMethod])

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Top Bar - Similar to Etherscan */}
        <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              Contract Interactions
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Read and write contract methods
            </p>
          </div>
          <ConnectWallet />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Error Loading Contracts
              </h3>
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <Button 
                onClick={refreshContracts} 
                variant="outline"
                className="bg-white text-red-700 border-red-300 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto"></div>
            <p className="text-gray-600 mt-3 text-sm">Loading contracts...</p>
          </div>
        )}

        {/* No Contracts */}
        {!isLoading && contracts.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-base font-medium text-yellow-900 mb-2">
                No Contracts Found
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                No contracts have been detected. Deploy contracts or add contract IDs manually.
              </p>
              <div className="bg-gray-800 rounded p-3 text-left">
                <code className="text-sm text-green-400 font-mono">
                  yarn deploy:testnet
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Contract Selector (if multiple contracts) */}
        {!isLoading && contracts.length > 1 && (
          <div className="mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <label className="text-sm text-gray-700 font-medium mr-3">Select Contract:</label>
              <select 
                value={selectedContract}
                onChange={(e) => setSelectedContract(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {contracts.map((contract, index) => (
                  <option key={contract.contractId} value={index}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Main Contract Display - Etherscan Style */}
        {!isLoading && contracts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Contract Header */}
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {contracts[selectedContract]?.name}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                {contracts[selectedContract]?.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {contracts[selectedContract]?.contractId}
                </span>
              </div>
            </div>

            {/* Tabs - Etherscan Style */}
            <Tabs defaultValue="read" className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
                  <TabsTrigger 
                    value="read" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-3 text-sm font-medium"
                  >
                    Read Contract
                  </TabsTrigger>
                  <TabsTrigger 
                    value="write"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-3 text-sm font-medium"
                  >
                    Write Contract
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="read" className="mt-0 p-0">
                {contracts[selectedContract]?.methods.filter(m => m.isReadOnly).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No read methods available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {contracts[selectedContract]?.methods
                      .filter(m => m.isReadOnly)
                      .map((method, idx) => (
                        <ContractMethodExecutor
                          key={method.name}
                          contractName={contracts[selectedContract].name}
                          method={method}
                          methodIndex={idx + 1}
                          onExecute={async (methodName, args) =>
                            handleMethodExecute(contracts[selectedContract].name, methodName, true, args)
                          }
                          isWalletConnected={isConnected}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="write" className="mt-0 p-0">
                {!isConnected && (
                  <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Connect your wallet to write to the contract
                    </p>
                  </div>
                )}
                {contracts[selectedContract]?.methods.filter(m => !m.isReadOnly).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No write methods available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {contracts[selectedContract]?.methods
                      .filter(m => !m.isReadOnly)
                      .map((method, idx) => (
                        <ContractMethodExecutor
                          key={method.name}
                          contractName={contracts[selectedContract].name}
                          method={method}
                          methodIndex={idx + 1}
                          onExecute={async (methodName, args) =>
                            handleMethodExecute(contracts[selectedContract].name, methodName, false, args)
                          }
                          isWalletConnected={isConnected}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Info Box */}
        {!isLoading && contracts.length > 0 && (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Dynamic Contract Interface
              </h3>
              <p className="text-xs text-blue-800">
                This interface automatically detects and adapts to any deployed Stellar contract. 
                Methods are dynamically generated with full TypeScript bindings and wallet integration.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}




