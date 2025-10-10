'use client'

import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  // Network switching not implemented in current useWallet hook
  const network = 'testnet'
  const switchNetwork = (value: string) => {
    console.log('Network switching not implemented:', value)
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
                onChange={(e) => switchNetwork(e.target.value)}
                className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="testnet">Testnet</option>
                <option value="futurenet">Futurenet</option>
                <option value="mainnet">Mainnet</option>
              </select>
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

