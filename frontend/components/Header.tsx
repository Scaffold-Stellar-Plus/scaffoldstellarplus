'use client'

import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'
import { useNetwork, NetworkType } from '@/contexts/NetworkContext'

export function Header() {
  const { network, setNetwork } = useNetwork()

  const handleNetworkChange = (value: string) => {
    setNetwork(value as NetworkType)
  }

  // Get network badge color
  const getNetworkBadgeColor = () => {
    switch (network) {
      case 'mainnet':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'testnet':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'futurenet':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <header className="bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">
              ScaffoldStellar+
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Network:</span>
              <select
                value={network}
                onChange={(e) => handleNetworkChange(e.target.value)}
                className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm font-medium cursor-pointer hover:border-primary transition-colors"
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
                <option value="futurenet">Futurenet</option>
              </select>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNetworkBadgeColor()}`}>
                {network.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Scaffold-Stellar-Plus/scaffoldstellarplus.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://scaffoldstellarplus.netlify.app/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

