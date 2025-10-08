'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ContractMethod } from '@/lib/contract-analyzer'

interface ContractMethodExecutorProps {
  contractName: string
  method: ContractMethod
  onExecute: (methodName: string, args: Record<string, any>) => Promise<any>
  isWalletConnected: boolean
}

export function ContractMethodExecutor({
  contractName,
  method,
  onExecute,
  isWalletConnected
}: ContractMethodExecutorProps) {
  const [args, setArgs] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleArgChange = (paramName: string, value: string, paramType: string) => {
    let parsedValue: any = value

    // Parse based on parameter type
    // u32 and i32 are regular numbers
    if (paramType.includes('u32') || paramType.includes('i32')) {
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

    setArgs(prev => ({
      ...prev,
      [paramName]: parsedValue
    }))
  }

  const handleExecute = async () => {
    setIsExecuting(true)
    setResult(null)
    setError(null)

    try {
      // Check wallet connection for write operations
      if (!method.isReadOnly && !isWalletConnected) {
        throw new Error('Please connect your wallet to execute write operations')
      }

      const executionResult = await onExecute(method.name, args)
      setResult(executionResult)
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
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{method.name}</CardTitle>
          <Badge
            variant={method.isReadOnly ? 'secondary' : 'default'}
            className={method.isReadOnly ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}
          >
            {method.isReadOnly ? 'READ' : 'WRITE'}
          </Badge>
        </div>
        {method.description && (
          <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parameters */}
        {method.parameters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Parameters:</h4>
            {method.parameters.map((param) => (
              <div key={param.name} className="space-y-1">
                <Label htmlFor={`${method.name}-${param.name}`} className="text-sm">
                  {param.name}
                  <span className="text-muted-foreground ml-2">({param.type})</span>
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={`${method.name}-${param.name}`}
                  type={param.type.includes('bool') ? 'checkbox' : 'text'}
                  placeholder={`Enter ${param.name}`}
                  onChange={(e) => handleArgChange(
                    param.name,
                    param.type.includes('bool') ? String(e.target.checked) : e.target.value,
                    param.type
                  )}
                  disabled={isExecuting}
                  className="bg-background"
                />
                {param.description && (
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting || (!method.isReadOnly && !isWalletConnected)}
          className={`w-full ${
            method.isReadOnly
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>Execute {method.name}</>
          )}
        </Button>

        {/* Wallet Warning for Write Operations */}
        {!method.isReadOnly && !isWalletConnected && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-400">
              Connect your wallet to execute write operations
            </p>
          </div>
        )}

        {/* Result Display */}
        {result !== null && (
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-400 mb-1">Success!</p>
              <pre className="text-xs text-green-300 overflow-x-auto">
                {formatResult(result)}
              </pre>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

