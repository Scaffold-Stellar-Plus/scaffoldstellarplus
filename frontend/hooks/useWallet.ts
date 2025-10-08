'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseWalletState {
  publicKey: string | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export function useWallet(): UseWalletState {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Import wallet functions dynamically to avoid SSR issues
        const { getPublicKey } = await import('@/lib/stellar-wallets-kit')
        
        const pk = await getPublicKey()
        if (pk) {
          setPublicKey(pk)
          setIsConnected(true)
        } else {
          setPublicKey(null)
          setIsConnected(false)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check wallet connection'
        setError(errorMessage)
        console.error('Error checking wallet connection:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Only check connection on client side
    if (typeof window !== 'undefined') {
      checkConnection()
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Import wallet functions dynamically
      const { connect: connectWallet, getPublicKey } = await import('@/lib/stellar-wallets-kit')
      
      await connectWallet(async () => {
        const pk = await getPublicKey()
        if (pk) {
          setPublicKey(pk)
          setIsConnected(true)
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      console.error('Error connecting wallet:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Import wallet functions dynamically
      const { disconnect: disconnectWallet } = await import('@/lib/stellar-wallets-kit')
      
      await disconnectWallet()
      setPublicKey(null)
      setIsConnected(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet'
      setError(errorMessage)
      console.error('Error disconnecting wallet:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    publicKey,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect
  }
}
