'use client'

import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/Button'
import { Wallet, AlertCircle } from 'lucide-react'

export function ConnectWallet() {
  const { 
    isConnected, 
    publicKey, 
    connect, 
    disconnect, 
    error,
    isLoading
  } = useWallet()

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <p className="text-sm font-medium text-foreground">
            Wallet Connected
          </p>
          <p className="font-mono text-sm bg-muted px-3 py-1 rounded">
            {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
          </p>
        </div>
        <Button 
          onClick={disconnect}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        onClick={connect}
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  )
}
