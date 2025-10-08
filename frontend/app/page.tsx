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
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Contract Interactions
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Interact with all deployed contracts dynamically
          </p>
          <ConnectWallet />
        </div>


        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <h3 className="text-lg font-medium text-destructive mb-2">
                Error Loading Contracts
              </h3>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={refreshContracts} variant="outline">
                Retry
              </Button>
            </div>
          </div>
        )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading contracts...</p>
              </div>
            )}

        {/* No Contracts */}
        {!isLoading && contracts.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-destructive mb-2">
                No Contracts Found
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                No contracts have been detected. Deploy contracts or add contract IDs manually.
              </p>
              <div className="bg-muted rounded-md p-3 text-left">
                <p className="text-foreground text-sm font-mono">
                  yarn deploy:testnet
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contracts List */}
        {!isLoading && contracts.length > 0 && (
          <div className="space-y-12">
            {contracts.map((contract, index) => (
              <div key={contract.contractId} className="bg-card rounded-lg shadow-lg p-6 border">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                    {contract.name}
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    {contract.description}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Contract ID: {contract.contractId}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{contract.totalMethods} methods</span>
                    {contract.hasReadMethods && <span>• Read operations</span>}
                    {contract.hasWriteMethods && <span>• Write operations</span>}
                    {contract.isStateful && <span>• Stateful</span>}
                  </div>
                </div>

                {/* Contract Methods */}
                <Tabs defaultValue="read" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="read">
                      Read Methods ({contract.methods.filter(m => m.isReadOnly).length})
                    </TabsTrigger>
                    <TabsTrigger value="write">
                      Write Methods ({contract.methods.filter(m => !m.isReadOnly).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="read" className="space-y-4 mt-4">
                    {contract.methods.filter(m => m.isReadOnly).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No read methods available
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {contract.methods
                          .filter(m => m.isReadOnly)
                          .map((method) => (
                            <ContractMethodExecutor
                              key={method.name}
                              contractName={contract.name}
                              method={method}
                              onExecute={async (methodName, args) =>
                                handleMethodExecute(contract.name, methodName, true, args)
                              }
                              isWalletConnected={isConnected}
                            />
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="write" className="space-y-4 mt-4">
                    {contract.methods.filter(m => !m.isReadOnly).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No write methods available
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {contract.methods
                          .filter(m => !m.isReadOnly)
                          .map((method) => (
                            <ContractMethodExecutor
                              key={method.name}
                              contractName={contract.name}
                              method={method}
                              onExecute={async (methodName, args) =>
                                handleMethodExecute(contract.name, methodName, false, args)
                              }
                              isWalletConnected={isConnected}
                            />
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 space-y-8">
          
          <div className="text-center">
            <div className="bg-accent border border-border rounded-md p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Dynamic Contract Detection
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                This interface automatically detects and adapts to any deployed Stellar contract.
                Add new contracts to your project and they will appear here automatically.
              </p>
              <div className="text-left space-y-2 text-sm text-muted-foreground">
                <p>• Automatically detects contract methods</p>
                <p>• Generates TypeScript bindings</p>
                <p>• Creates interactive UI components</p>
                <p>• Real contract interactions (read & write)</p>
                <p>• Works with any deployed contract ID</p>
                <p>• Dynamic client generation inspired by CosmoUI</p>
                <p>• Full wallet integration for write operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}




