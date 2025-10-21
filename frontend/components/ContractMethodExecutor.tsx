'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ContractMethod } from '@/lib/contract-analyzer'

interface ContractMethodExecutorProps {
  contractName: string
  method: ContractMethod
  methodIndex: number
  onExecute: (methodName: string, args: Record<string, any>) => Promise<any>
  isWalletConnected: boolean
}

export function ContractMethodExecutor({
  contractName,
  method,
  methodIndex,
  onExecute,
  isWalletConnected
}: ContractMethodExecutorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [args, setArgs] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const handleArgChange = (paramName: string, value: string, paramType: string) => {
    let parsedValue: any = value

    try {
      // Parse based on parameter type
      
      // Handle Vec<> types (arrays)
      if (paramType.includes('Vec<') || paramType.includes('Array<')) {
        if (!value || value.trim() === '') {
          parsedValue = []
        } else {
          // Parse JSON array
          const arrayValue = JSON.parse(value)
          
          // Get the inner type (e.g., "i128" from "Vec<i128>")
          const innerTypeMatch = paramType.match(/(?:Vec|Array)<(.+)>/)
          const innerType = innerTypeMatch ? innerTypeMatch[1].trim() : ''
          
          // Convert array elements based on inner type
          if (innerType.includes('i128') || innerType.includes('u128') ||
              innerType.includes('i64') || innerType.includes('u64') ||
              innerType.includes('i256') || innerType.includes('u256')) {
            // Convert to BigInt for large integers
            parsedValue = arrayValue.map((v: any) => BigInt(v))
          } else if (innerType.includes('i32') || innerType.includes('u32')) {
            // Convert to regular numbers for 32-bit integers
            parsedValue = arrayValue.map((v: any) => parseInt(v, 10))
          } else if (innerType === 'Address' || innerType === 'string') {
            // Keep as strings for Address and string types
            parsedValue = arrayValue.map((v: any) => String(v))
          } else {
            // Default: keep array as-is
            parsedValue = arrayValue
          }
        }
      }
      // u32 and i32 are regular numbers
      else if (paramType.includes('u32') || paramType.includes('i32')) {
        parsedValue = value ? parseInt(value, 10) : undefined
      }
      // u64, i64, u128, i128, u256, i256 are BigInt
      else if (paramType.includes('u64') || paramType.includes('i64') || 
               paramType.includes('u128') || paramType.includes('i128') ||
               paramType.includes('u256') || paramType.includes('i256')) {
        parsedValue = value ? BigInt(value) : undefined
      } 
      // Boolean parsing
      else if (paramType.includes('bool')) {
        parsedValue = value === 'true'
      }
      // String (default) - keep as is
    } catch (error) {
      // If parsing fails, keep the original string value
      console.error(`Error parsing parameter ${paramName}:`, error)
      parsedValue = value
    }

    setArgs(prev => ({
      ...prev,
      [paramName]: parsedValue
    }))
  }

  const handleExecute = async () => {
    setIsExecuting(true)
    setResult(null)
    setError(null)
    setTransactionHash(null)

    try {
      // Check wallet connection for write operations
      if (!method.isReadOnly && !isWalletConnected) {
        throw new Error('Please connect your wallet to execute write operations')
      }

      const executionResult = await onExecute(method.name, args)
      setResult(executionResult)
      
      // Extract transaction hash if available (for write operations)
      if (!method.isReadOnly && executionResult) {
        // Try to extract hash from various possible locations
        const hash = executionResult?.hash || 
                    executionResult?.transactionHash || 
                    executionResult?.id ||
                    executionResult?.txHash ||
                    (executionResult?.result?.hash)
        if (hash) {
          setTransactionHash(hash)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Operation failed')
      console.error('Method execution error:', err)
    } finally {
      setIsExecuting(false)
    }
  }

  const formatResult = (result: any): string => {
    if (result === null || result === undefined) return 'null'
    if (typeof result === 'bigint') return result.toString()
    if (typeof result === 'object') return JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2)
    return String(result)
  }

  return (
    <div className="hover:bg-gray-50">
      {/* Method Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-gray-500">
            {methodIndex}.
          </span>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">
              {method.name}
            </span>
            {method.description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {method.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {method.parameters.length} params
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Method Details - Expanded view */}
      {isExpanded && (
        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4 mt-4">
            {/* Parameters */}
            {method.parameters.length > 0 ? (
              <div className="space-y-3">
                {method.parameters.map((param, idx) => (
                  <div key={param.name} className="space-y-1.5">
                    <Label 
                      htmlFor={`${method.name}-${param.name}`} 
                      className="text-xs font-medium text-gray-700"
                    >
                      {param.name} <span className="text-gray-500">({param.type})</span>
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${method.name}-${param.name}`}
                        type={param.type.includes('bool') ? 'checkbox' : 'text'}
                        placeholder={
                          param.type.includes('Vec<') || param.type.includes('Array<')
                            ? `["item1","item2"]`
                            : `Enter ${param.name}`
                        }
                        onChange={(e) => handleArgChange(
                          param.name,
                          param.type.includes('bool') ? String(e.target.checked) : e.target.value,
                          param.type
                        )}
                        disabled={isExecuting}
                        className="flex-1 h-9 text-sm bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {param.description && (
                      <p className="text-xs text-gray-500">{param.description}</p>
                    )}
                    {(param.type.includes('Vec<') || param.type.includes('Array<')) && (
                      <p className="text-xs text-blue-600 italic">
                        💡 Enter as JSON array: {param.type.includes('i128') ? '[1000000000,2000000000]' : '["addr1","addr2"]'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No parameters required</p>
            )}

            {/* Execute Button */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleExecute}
                disabled={isExecuting || (!method.isReadOnly && !isWalletConnected)}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  method.isReadOnly
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {isExecuting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                    Executing...
                  </span>
                ) : (
                  <>{method.isReadOnly ? 'Query' : 'Write'}</>
                )}
              </Button>
              
              {!method.isReadOnly && !isWalletConnected && (
                <span className="text-xs text-yellow-600">
                  ⚠️ Wallet required
                </span>
              )}
            </div>

            {/* Result Display */}
            {result !== null && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    {method.isReadOnly ? (
                      <>
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Result:
                        </p>
                        <div className="bg-white border border-green-200 rounded p-2">
                          <pre className="text-xs text-gray-800 overflow-x-auto font-mono">
                            {formatResult(result)}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-green-800 mb-2">
                          ✓ Transaction Submitted
                        </p>
                        {transactionHash && (
                          <div className="mb-2">
                            <p className="text-xs text-green-700 mb-1">Transaction Hash:</p>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded p-2">
                              <code className="text-xs text-gray-700 font-mono break-all flex-1">
                                {transactionHash}
                              </code>
                              <button
                                onClick={() => navigator.clipboard.writeText(transactionHash)}
                                className="text-green-600 hover:text-green-700 flex-shrink-0 p-1"
                                title="Copy"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                        <details className="mt-2">
                          <summary className="text-xs text-green-700 cursor-pointer hover:text-green-800">
                            View details
                          </summary>
                          <div className="mt-2 bg-white border border-green-200 rounded p-2">
                            <pre className="text-xs text-gray-800 overflow-x-auto font-mono">
                              {formatResult(result)}
                            </pre>
                          </div>
                        </details>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

