'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Play, 
  Eye, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Parameter {
  name: string
  type: string
  required: boolean
}

interface Method {
  name: string
  description?: string
  parameters: Parameter[]
  returnType: string
  isReadOnly: boolean
}

interface ContractMethodCardProps {
  method: Method
  contractId: string
  contractName: string
  onMethodCall: (methodName: string, args: any[], isReadOnly: boolean) => Promise<any>
  isLoading: boolean
  result?: any
  error?: string
}

export function ContractMethodCard({ 
  method, 
  contractId, 
  contractName,
  onMethodCall, 
  isLoading, 
  result, 
  error 
}: ContractMethodCardProps) {
  const [args, setArgs] = useState<Record<string, string>>({})
  const [methodResult, setMethodResult] = useState<any>(null)
  const [methodError, setMethodError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const updateArg = (paramName: string, value: string) => {
    setArgs(prev => ({
      ...prev,
      [paramName]: value
    }))
  }

  const handleMethodCall = async () => {
    setIsExecuting(true)
    setMethodError(null)
    setMethodResult(null)

    try {
      const argsArray = method.parameters.map(param => {
        const value = args[param.name] || ''
        
        // Basic type conversion based on parameter type
        if (param.type.includes('i32') || param.type.includes('u32')) {
          return parseInt(value) || 0
        } else if (param.type.includes('i64') || param.type.includes('u64')) {
          return BigInt(value) || BigInt(0)
        } else if (param.type.includes('bool')) {
          return value.toLowerCase() === 'true'
        } else if (param.type.includes('String')) {
          return value
        } else {
          return value
        }
      })

      const result = await onMethodCall(method.name, argsArray, method.isReadOnly)
      setMethodResult(result)
    } catch (err) {
      setMethodError(err instanceof Error ? err.message : 'Method call failed')
    } finally {
      setIsExecuting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getInputType = (paramType: string) => {
    if (paramType.includes('i32') || paramType.includes('u32') || paramType.includes('i64') || paramType.includes('u64')) {
      return 'number'
    } else if (paramType.includes('bool')) {
      return 'checkbox'
    }
    return 'text'
  }

  const getPlaceholder = (paramType: string) => {
    if (paramType.includes('i32') || paramType.includes('u32')) {
      return 'e.g., 42'
    } else if (paramType.includes('i64') || paramType.includes('u64')) {
      return 'e.g., 1000000000'
    } else if (paramType.includes('bool')) {
      return 'true or false'
    } else if (paramType.includes('String')) {
      return 'Enter text'
    } else if (paramType.includes('Address')) {
      return 'e.g., CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3KWX'
    }
    return 'Enter value'
  }

  const isFormValid = () => {
    return method.parameters.every(param => {
      if (param.required) {
        const value = args[param.name]
        return value !== undefined && value.trim() !== ''
      }
      return true
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {method.isReadOnly ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <Play className="h-4 w-4 text-blue-600" />
            )}
            {method.name}
          </CardTitle>
          <Badge 
            variant={method.isReadOnly ? "secondary" : "default"}
            className={cn(
              method.isReadOnly 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-blue-100 text-blue-800 border-blue-200"
            )}
          >
            {method.isReadOnly ? 'Read' : 'Write'}
          </Badge>
        </div>
        
        {method.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {method.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            Returns: {method.returnType}
          </span>
          {method.parameters.length > 0 && (
            <span>{method.parameters.length} parameter{method.parameters.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Parameters */}
        {method.parameters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Parameters
            </h4>
            {method.parameters.map((param, index) => (
              <div key={index} className="space-y-2">
                <Label 
                  htmlFor={`${method.name}_${param.name}`}
                  className="text-sm font-medium flex items-center gap-2"
                >
                  {param.name}
                  <Badge variant="outline" className="text-xs">
                    {param.type}
                  </Badge>
                  {param.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </Label>
                
                {getInputType(param.type) === 'checkbox' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      id={`${method.name}_${param.name}`}
                      type="checkbox"
                      checked={args[param.name] === 'true'}
                      onChange={(e) => updateArg(param.name, e.target.checked.toString())}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`${method.name}_${param.name}`} className="text-sm">
                      {param.name}
                    </Label>
                  </div>
                ) : (
                  <Input
                    id={`${method.name}_${param.name}`}
                    type={getInputType(param.type)}
                    value={args[param.name] || ''}
                    onChange={(e) => updateArg(param.name, e.target.value)}
                    placeholder={getPlaceholder(param.type)}
                    className="w-full"
                    disabled={isExecuting || isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleMethodCall}
          disabled={isExecuting || isLoading || !isFormValid()}
          className={cn(
            "w-full",
            method.isReadOnly 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {method.isReadOnly ? 'Reading...' : 'Executing...'}
            </>
          ) : (
            <>
              {method.isReadOnly ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {method.isReadOnly ? 'Read' : 'Execute'} {method.name}
            </>
          )}
        </Button>

        {/* Error Display */}
        {methodError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Error executing {method.name}
                </p>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {methodError}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(methodError)}
                className="text-red-600 hover:text-red-700"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Result Display */}
        {methodResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  {method.name} executed successfully
                </p>
                <div className="mt-2">
                  <pre className="text-green-600 dark:text-green-400 text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(methodResult, null, 2)}
                  </pre>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(methodResult, null, 2))}
                className="text-green-600 hover:text-green-700"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
