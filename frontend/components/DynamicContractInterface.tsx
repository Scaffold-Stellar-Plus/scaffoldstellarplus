'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClientOnly } from '@/components/ClientOnly'
import { useWallet } from '@/hooks/useWallet'

interface ContractMethod {
  name: string
  parameters: ParameterInfo[]
  returnType: string
  isReadOnly: boolean
  description?: string
}

interface ParameterInfo {
  name: string
  type: string
  required: boolean
}

interface DynamicContractInterfaceProps {
  contractId: string
  contractName: string
  contractMetadata?: any
}

export function DynamicContractInterface({
  contractId,
  contractName,
  contractMetadata
}: DynamicContractInterfaceProps) {
  const [methods, setMethods] = useState<ContractMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, publicKey } = useWallet()

  // Get contract client based on contract name (using auto-generated map)
  const getContractClient = useCallback(async () => {
    try {
      // Import from centralized auto-generated contract analyzer
      const { getContractClient: loadClient } = await import('@/lib/contract-analyzer')
      return await loadClient(contractName)
    } catch (err) {
      console.error('Error loading contract client:', err)
      throw err
    }
  }, [contractName])

  // Load contract methods from metadata
  useEffect(() => {
    if (contractMetadata?.methods) {
      const contractMethods = contractMetadata.methods.map((method: any) => ({
        name: method.name,
        parameters: method.parameters || [],
        returnType: method.returnType || 'unknown',
        isReadOnly: method.isReadOnly || false,
        description: method.description
      }))
      setMethods(contractMethods)
      
      // Set default selected method to first read method
      const firstReadMethod = contractMethods.find((m: ContractMethod) => m.isReadOnly)
      if (firstReadMethod) {
        setSelectedMethod(firstReadMethod.name)
      }
    }
  }, [contractMetadata])

  // Handle parameter input changes
  const handleParameterChange = useCallback((paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }))
  }, [])

  // Execute contract method
  const executeMethod = useCallback(async () => {
    if (!selectedMethod) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const client = await getContractClient()
      const method = methods.find(m => m.name === selectedMethod)
      
      if (!method) {
        throw new Error(`Method ${selectedMethod} not found`)
      }

      // Prepare parameters
      const methodParams = method.parameters.map(param => {
        const value = parameters[param.name]
        if (value === undefined || value === '') {
          return param.type === 'u32' || param.type === 'i32' ? 0 : ''
        }
        
        // Type conversion
        if (param.type === 'u32' || param.type === 'i32') {
          return parseInt(value) || 0
        }
        if (param.type === 'string' || param.type === 'Symbol') {
          return String(value)
        }
        return value
      })

      let result: any

      if (method.isReadOnly) {
        // Read operation
        const methodName = method.name as keyof typeof client
        if (typeof client[methodName] === 'function') {
          if (methodParams.length > 0) {
            result = await (client[methodName] as any)(...methodParams)
          } else {
            result = await (client[methodName] as any)()
          }
        } else {
          throw new Error(`Method ${String(methodName)} not available on client`)
        }
      } else {
        // Write operation - requires wallet connection
        if (!isConnected || !publicKey) {
          throw new Error('Wallet must be connected for write operations')
        }

        const methodName = method.name as keyof typeof client
        if (typeof client[methodName] === 'function') {
          // For write operations, we need to sign the transaction
          if (methodParams.length > 0) {
            result = await (client[methodName] as any)(...methodParams)
          } else {
            result = await (client[methodName] as any)()
          }
        } else {
          throw new Error(`Method ${String(methodName)} not available on client`)
        }
      }

      // Decode the result for better display
      let decodedResult = result
      
      // If result has simulationResult, extract the return value
      if (result && typeof result === 'object' && result.simulationResult && result.simulationResult.retval) {
        try {
          // Decode base64 return value
          const retvalBytes = atob(result.simulationResult.retval)
          const retvalArray = new Uint8Array(retvalBytes.length)
          for (let i = 0; i < retvalBytes.length; i++) {
            retvalArray[i] = retvalBytes.charCodeAt(i)
          }
          
          // Try to parse as different types based on return type
          switch (method.returnType) {
            case 'u32':
              // For u32, the first 4 bytes represent the value
              if (retvalArray.length >= 4) {
                const value = new DataView(retvalArray.buffer, 0, 4).getUint32(0, true)
                decodedResult = {
                  method: selectedMethod,
                  returnType: method.returnType,
                  value: value,
                  raw: result
                }
              } else {
                decodedResult = {
                  method: selectedMethod,
                  returnType: method.returnType,
                  value: retvalArray[0] || 0,
                  raw: result
                }
              }
              break
            case 'string':
              // For string, try to decode as UTF-8
              try {
                const decoder = new TextDecoder('utf-8')
                const stringValue = decoder.decode(retvalArray)
                decodedResult = {
                  method: selectedMethod,
                  returnType: method.returnType,
                  value: stringValue,
                  raw: result
                }
              } catch {
                decodedResult = {
                  method: selectedMethod,
                  returnType: method.returnType,
                  value: `Raw bytes: ${Array.from(retvalArray).join(', ')}`,
                  raw: result
                }
              }
              break
            default:
              decodedResult = {
                method: selectedMethod,
                returnType: method.returnType,
                value: `Raw bytes: ${Array.from(retvalArray).join(', ')}`,
                raw: result
              }
          }
        } catch (decodeError) {
          console.error('Error decoding result:', decodeError)
          decodedResult = {
            method: selectedMethod,
            error: 'Failed to decode result',
            raw: result
          }
        }
      }

      setResult(decodedResult)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute method'
      setError(errorMessage)
      console.error('Error executing method:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMethod, parameters, methods, getContractClient, isConnected, publicKey])

  // Render parameter input
  const renderParameterInput = (param: ParameterInfo) => {
    const value = parameters[param.name] || ''
    
    switch (param.type) {
      case 'u32':
      case 'i32':
        return (
          <Input
            type="number"
            placeholder={`Enter ${param.name}`}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
          />
        )
      case 'string':
      case 'Symbol':
        return (
          <Input
            type="text"
            placeholder={`Enter ${param.name}`}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
          />
        )
      default:
        return (
          <Input
            type="text"
            placeholder={`Enter ${param.name}`}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
          />
        )
    }
  }

  const readMethods = methods.filter(m => m.isReadOnly)
  const writeMethods = methods.filter(m => !m.isReadOnly)

  return (
    <ClientOnly fallback={
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading contract interface...</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Method Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Method</label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">Choose a method...</option>
            {readMethods.map((method) => (
              <option key={method.name} value={method.name}>
                {method.name}() - {method.returnType} [READ]
              </option>
            ))}
            {writeMethods.map((method) => (
              <option key={method.name} value={method.name}>
                {method.name}() - {method.returnType} [WRITE]
              </option>
            ))}
          </select>
        </div>

        {/* Parameters */}
        {selectedMethod && (
          <div>
            <label className="block text-sm font-medium mb-2">Parameters</label>
            <div className="space-y-3">
              {methods
                .find(m => m.name === selectedMethod)
                ?.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {param.name} ({param.type})
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderParameterInput(param)}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Execute Button */}
        {selectedMethod && (
          <div>
            <Button
              onClick={executeMethod}
              disabled={isLoading || (!methods.find(m => m.name === selectedMethod)?.isReadOnly && !isConnected)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                <>
                  {methods.find(m => m.name === selectedMethod)?.isReadOnly ? 'Read' : 'Write'} Method
                  {!methods.find(m => m.name === selectedMethod)?.isReadOnly && !isConnected && (
                    <span className="ml-2 text-xs">(Connect wallet required)</span>
                  )}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h4 className="text-sm font-medium text-destructive mb-1">Error</h4>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result !== null && (
          <div>
            <label className="block text-sm font-medium mb-2">Result</label>
            <Card className="p-4">
              {result.value !== undefined ? (
                <div>
                  <div className="mb-2">
                    <span className="text-sm font-medium">Method: </span>
                    <span className="text-sm">{result.method}</span>
                  </div>
                  {result.returnType && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Return Type: </span>
                      <span className="text-sm">{result.returnType}</span>
                    </div>
                  )}
                  <div className="mb-3">
                    <span className="text-sm font-medium">Value: </span>
                    <span className="text-lg font-mono bg-muted px-2 py-1 rounded">
                      {result.value}
                    </span>
                  </div>
                  {result.raw && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Show raw response
                      </summary>
                      <pre className="text-xs overflow-auto mt-2 bg-muted p-2 rounded">
                        {JSON.stringify(result.raw, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </Card>
          </div>
        )}

        {/* Method Info */}
        {methods.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Methods</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {readMethods.map((method) => (
                <div key={method.name} className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">READ</Badge>
                  <span className="text-sm font-mono">{method.name}()</span>
                  <span className="text-xs text-muted-foreground">→ {method.returnType}</span>
                </div>
              ))}
              {writeMethods.map((method) => (
                <div key={method.name} className="flex items-center space-x-2">
                  <Badge variant="destructive" className="text-xs">WRITE</Badge>
                  <span className="text-sm font-mono">{method.name}()</span>
                  <span className="text-xs text-muted-foreground">→ {method.returnType}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}
