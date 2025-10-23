# Scaffold Stellar Plus 🚀

**Scaffold Stellar Plus** is an enhanced, production-ready fullstack boilerplate for building Stellar Soroban smart contracts with a Next.js 14 frontend. It features **100% zero-configuration dynamic contract detection**, **multi-wallet support**, and **powerful reusable hooks** for seamless blockchain interactions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black)](https://nextjs.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-purple)](https://stellar.org/)

---

## 🎯 What is Scaffold Stellar Plus?

Scaffold Stellar Plus is a complete development environment that bridges Stellar Soroban smart contracts with modern web applications. Unlike traditional scaffolds, it **automatically detects and adapts** to any contract structure, eliminating manual configuration and enabling rapid prototyping.

### Key Differentiators from Official Scaffolding

| Feature | Scaffold Stellar Plus | Standard Approach |
|---------|----------------------|-------------------|
| **Contract Detection** | 100% automatic - zero config needed | Manual contract registration |
| **UI Generation** | Auto-generated forms for all methods | Hand-coded for each contract |
| **Type Safety** | Full TypeScript with auto-bindings | Partial or manual types |
| **Hook System** | Reusable `callReadMethod` & `callWriteMethod` hooks | Custom hooks for each contract |
| **Wallet Integration** | Multi-wallet with unified API | Single wallet or fragmented support |
| **Method Classification** | Intelligent read/write detection | Manual specification required |
| **Contract Management** | CLI tools for create/remove/deploy | Manual file management |
| **Metadata Generation** | Auto-generated from bindings | Manual JSON maintenance |

---

## ✨ Core Functionalities

### 1. **Dynamic Contract System** 🔍

The heart of Scaffold Stellar Plus is its ability to **dynamically analyze and interact** with any Soroban contract:

- **Automatic Method Discovery**: Scans TypeScript bindings to extract all contract methods
- **Smart Classification**: Distinguishes read-only queries from state-changing writes
- **Parameter Inference**: Automatically determines parameter types and requirements
- **Constructor Detection**: Auto-detects constructor arguments and prompts interactively during deployment
- **UI Generation**: Creates interactive forms with validation for every method
- **Real-time Adaptation**: Updates UI immediately when contracts are deployed

### 2. **Unified Hook System** 🎣

Two powerful hooks provide a consistent interface for all contract interactions:

- **`useDynamicContracts()`**: Master hook for contract management
  - `callReadMethod(contractName, methodName, args)` - Execute read operations
  - `callWriteMethod(contractName, methodName, args)` - Execute write operations with wallet signing
  - `contracts` - Array of all deployed contracts with metadata
  - `refreshContracts()` - Reload contract state

- **`useWallet()`**: Wallet connection management
  - `connect()` - Connect to Stellar wallets (Freighter, Albedo, XBull)
  - `disconnect()` - Disconnect wallet
  - `publicKey` - Current user's public key
  - `isConnected` - Connection status

### 3. **Multi-Wallet Support** 👛

Seamless integration with all major Stellar wallets:
- **Freighter** (recommended)
- **Albedo**
- **XBull**
- **Rabet**
- Any wallet supporting `stellar-wallets-kit`

### 4. **CLI Contract Management** 🛠️

Powerful scripts for the complete contract lifecycle:

```bash
yarn initcontract <name>      # Create new contract with boilerplate
yarn build:contracts          # Build all contracts to WASM
yarn test:contracts           # Run contract unit tests
yarn deploy:testnet           # Deploy & auto-generate bindings
yarn removecontract <name>    # Remove contract and cleanup
```

### 5. **Automatic Code Generation** ⚙️

Zero manual updates required:
- **TypeScript Bindings**: Generated during deployment
- **Contract Imports**: Auto-generated import map (`contract-map.ts`)
- **Metadata JSON**: Contract methods, types, and descriptions
- **SDK Version Fixing**: Automatically patches SDK compatibility issues

### 6. **Professional UI/UX** 🎨

Built with best practices:
- **Etherscan-inspired Interface**: Familiar tabbed layout for read/write operations
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Support**: Automatic theme switching
- **Loading States**: Animated spinners with elapsed time
- **Error Handling**: Clear, actionable error messages
- **Transaction Feedback**: Real-time status with transaction hashes

### 7. **Multi-Network Support** 🌐

Seamless switching between Stellar networks:
- **Network Selector**: Switch between Testnet, Mainnet, and Futurenet in the header
- **Automatic Configuration**: Contract IDs, RPC URLs, and network settings update instantly
- **Persistent Selection**: Network choice saved in localStorage
- **Visual Indicators**: Color-coded badges (🟢 Mainnet, 🔵 Testnet, 🟣 Futurenet)
- **Production-Ready**: Deploy to mainnet with interactive private key collection
- **Safe Deployment**: Double confirmation required for mainnet deployments

---

## 🚀 Quick Start

Choose your preferred installation method:

### ⚡ NPX (Fastest - Recommended)

```bash
npx create-scaffoldstellarplus my-stellar-dapp
cd my-stellar-dapp
yarn setup
yarn deploy:testnet
yarn dev
```

### 📋 GitHub Template

1. Click [**Use this template**](https://github.com/Scaffold-Stellar-Plus/scaffoldstellarplus/generate) on GitHub
2. Clone your new repository
3. Run setup:
   ```bash
   yarn setup
   yarn deploy:testnet
   yarn dev
   ```

### 📖 Manual Installation

For detailed installation instructions and prerequisites, see [INSTALL.md](./INSTALL.md).

---

## 🚀 Setup & Installation

### Prerequisites

Ensure you have the following installed:

1. **Rust Toolchain** with `wasm32v1-none` target:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32v1-none
   ```

2. **Stellar CLI** (latest version):
   ```bash
   cargo install --locked stellar-cli --features opt
   ```

3. **Node.js 18+** and **Yarn**:
   ```bash
   # Install Node.js from https://nodejs.org/
   npm install -g yarn
   ```

4. **Stellar Wallet**: Install [Freighter](https://www.freighter.app/) browser extension

### Detailed Installation Steps

If you're not using the quick start methods above, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Scaffold-Stellar-Plus/scaffoldstellarplus.git
   cd scaffoldstellarplus
   ```

2. **Run setup** (one command does it all):
   ```bash
   yarn setup
   ```
   
   This automatically:
   - Installs all dependencies (root, contracts, frontend)
   - Creates Stellar identities for testnet/futurenet
   - Builds all contracts to WASM
   - Prepares the development environment

3. **Deploy contracts** to testnet:
   ```bash
   yarn deploy:testnet
   ```
   
   This:
   - Deploys all contracts in `contracts/` directory
   - Generates TypeScript bindings
   - Creates contract import map
   - Generates metadata for dynamic UI

4. **Start development server**:
   ```bash
   yarn dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to see your app!

---

## 📖 Getting Started

### Your First Contract Interaction

1. **Connect Your Wallet**: Click "Connect Wallet" in the top-right corner

2. **Select a Contract**: Choose from the auto-detected contracts (hello_world, increment, token)

3. **Read Data**: Switch to the "Read Contract" tab and call a method like `get_count()`

4. **Write Data**: Switch to "Write Contract", connect wallet, and call `increment()`

### Adding a New Contract

```bash
# Create a new contract
yarn initcontract my_counter

# This creates:
# contracts/my_counter/
# ├── src/
# │   ├── lib.rs      (contract implementation)
# │   └── test.rs     (unit tests)
# └── Cargo.toml      (dependencies)
```

**Edit** `contracts/my_counter/src/lib.rs`:

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct MyCounter;

#[contractimpl]
impl MyCounter {
    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().instance().get(&"count").unwrap_or(0);
        count += 1;
        env.storage().instance().set(&"count", &count);
        count
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage().instance().get(&"count").unwrap_or(0)
    }
}
```

**Deploy** and watch the magic:

```bash
yarn deploy:testnet
```

The frontend **automatically detects** your new contract and generates UI components! No manual code changes needed.

---

## 📚 Available Commands

### Contract Development

| Command | Description |
|---------|-------------|
| `yarn initcontract <name>` | Create a new contract with boilerplate code |
| `yarn removecontract <name>` | Remove a contract and update workspace |
| `yarn build:contracts` | Build all contracts to WASM |
| `yarn test:contracts` | Run Rust unit tests for all contracts |
| `yarn optimize` | Optimize WASM files for production |

### Deployment

| Command | Description |
|---------|-------------|
| `yarn setup` | Complete project setup (run once) |
| `yarn deploy:testnet` | Deploy **all** contracts to Stellar testnet + generate bindings |
| `yarn deploy:testnet <contract>` | Deploy **specific** contract to testnet (e.g., `yarn deploy:testnet hello_world`) |
| `yarn deploy:mainnet` | Deploy **all** contracts to Stellar **mainnet** (requires private key) ⚠️ |
| `yarn deploy:mainnet <contract>` | Deploy **specific** contract to mainnet (e.g., `yarn deploy:mainnet hello_world`) ⚠️ |
| `yarn deploy:futurenet` | Deploy to Stellar futurenet |
| `yarn deploy:localnet` | Deploy to local Stellar network |
| `yarn copy:deployments` | Copy deployment files to frontend public directory |

### Frontend Development

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Next.js development server |
| `yarn build` | Build contracts + frontend for production |
| `yarn lint` | Run ESLint on frontend code |
| `yarn type-check` | Check TypeScript types |

### Code Generation & Utilities

| Command | Description |
|---------|-------------|
| `yarn build:packages` | Build contract packages (generates `dist/` folders) |
| `yarn generate:contract-imports` | Auto-generate contract import map |
| `yarn generate:metadata` | Regenerate contract metadata JSON |
| `yarn detect:contracts` | Detect and analyze all contracts |

### Maintenance

| Command | Description |
|---------|-------------|
| `yarn clean` | Remove contracts/target, packages, metadata, contract imports, and Next.js build artifacts |
| `yarn clean:frontend` | Remove all auto-generated frontend files (packages, metadata, contract imports, .next) |
| `yarn clean:all` | Deep clean (includes `node_modules`, contracts/target, and all auto-generated files) |

**What gets removed during `yarn clean`:**
- `contracts/target/` - Compiled WASM contracts
- `frontend/packages/*/` - All auto-generated contract packages (TypeScript bindings)
- `frontend/contracts/*.ts` - Auto-generated contract import files (except `util.ts`)
- `frontend/lib/contract-metadata.json` - Auto-generated contract metadata
- `frontend/.next/` - Next.js build cache

**To regenerate after cleaning:**
```bash
yarn deploy:testnet  # Rebuilds everything and redeploys
# OR if contracts are already deployed:
yarn build:packages && yarn post-deploy
```

---

## 🚀 Deploying to Mainnet

ScaffoldStellar+ supports secure deployment to Stellar Mainnet with built-in safety features.

### Prerequisites for Mainnet

Before deploying to mainnet, ensure you have:

1. **A funded Stellar account** with sufficient XLM for deployment fees
2. **Your account's private key** (starts with 'S')
3. **Tested contracts** on testnet first

⚠️ **Important**: Mainnet deployments use real XLM and cannot be undone. Always test thoroughly on testnet first.

### Deployment Process

1. **Deploy to mainnet**:
   ```bash
   yarn deploy:mainnet
   ```

2. **Enter your private key** when prompted (input is masked):
   ```
   🔐 MAINNET DEPLOYMENT - PRIVATE KEY REQUIRED
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️  WARNING: You are deploying to Stellar MAINNET!
   ⚠️  This will use real XLM from your account.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Enter your private key: ********
   ```

3. **Confirm deployment** by typing exactly:
   ```
   DEPLOY TO MAINNET
   ```

4. **Wait for deployment** - the script will:
   - Build all contracts
   - Deploy to Stellar mainnet
   - Generate TypeScript bindings
   - Create mainnet configuration files

### Generated Mainnet Files

After deployment, you'll have:
- `.env.mainnet.local` - Mainnet environment variables
- `deployment-mainnet.json` - Mainnet contract addresses
- `frontend/public/deployment-mainnet.json` - For network switching

### Network Switching

Switch between networks using the selector in the header:

1. **Testnet** (🔵) - Development and testing
2. **Mainnet** (🟢) - Production deployment
3. **Futurenet** (🟣) - Experimental features

The frontend automatically loads the correct contract addresses and RPC endpoints.

### Security Notes

✅ **Safe Practices**:
- Private key is never logged or stored
- Input is masked during entry
- Double confirmation required
- Script runs entirely locally

⚠️ **Never**:
- Commit private keys to git
- Share your private key
- Use production keys in development

### Complete Deployment Workflow

```bash
# 1. Test on testnet (all contracts)
yarn deploy:testnet
yarn dev  # Test in browser

# 2. Deploy to mainnet (all contracts)
yarn deploy:mainnet  # Interactive prompts

# 3. Frontend automatically supports both networks
yarn dev  # Switch networks in header
```

### Selective Contract Deployment

Deploy only specific contracts instead of all:

```bash
# Deploy only hello_world to testnet
yarn deploy:testnet hello_world

# Deploy only increment to mainnet
yarn deploy:mainnet increment
```

### 🔧 Constructor Argument Detection

Scaffold Stellar Plus automatically detects constructor arguments and prompts you interactively during deployment:

**Features:**
- **Auto-Detection**: Scans Rust source code for `__constructor` functions
- **Interactive Prompts**: User-friendly prompts with type validation
- **Smart Validation**: Validates Stellar addresses, integers, strings, etc.
- **Type-Aware**: Handles Address, String, Symbol, i128, u32, bool, Vec types
- **CLI Integration**: Automatically formats arguments for Stellar CLI

**Example:**
```bash
# Deploying a contract with constructor arguments
yarn deploy:testnet pool

🔧 Constructor Arguments for pool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This contract requires 4 constructor argument(s):

1. token_a (Stellar address (starts with C or G))
   Enter value for token_a: CCVQ4H65EXQTPONOYK7CTH6JMCAWKJ4RP257FE2MA2UCF2AHVRHGQNTA
   ✓ Set to: CCVQ4H65EXQTPONOYK7CTH6JMCAWKJ4RP257FE2MA2UCF2AHVRHGQNTA

2. token_b (Stellar address (starts with C or G))
   Enter value for token_b: CDIJAM6NYMJG5BCATG4TY75GCO4YP4ZYQHTFMH6KH64GEELIM7XH7E4E
   ✓ Set to: CDIJAM6NYMJG5BCATG4TY75GCO4YP4ZYQHTFMH6KH64GEELIM7XH7E4E

3. lp_token_name (Text string)
   Enter value for lp_token_name: Cosmo LP Token
   ✓ Set to: "Cosmo LP Token"

4. lp_token_symbol (Text string)
   Enter value for lp_token_symbol: COSMO
   ✓ Set to: COSMO

✅ Constructor arguments collected: --token_a CCVQ4H65EXQTPONOYK7CTH6JMCAWKJ4RP257FE2MA2UCF2AHVRHGQNTA --token_b CDIJAM6NYMJG5BCATG4TY75GCO4YP4ZYQHTFMH6KH64GEELIM7XH7E4E --lp_token_name "Cosmo LP Token" --lp_token_symbol COSMO

# Deploy multiple contracts individually
yarn deploy:testnet hello_world
yarn deploy:testnet increment
# All post-deployment steps run automatically!
```

**Benefits:**
- ⚡ Faster deployment (only builds/deploys one contract)
- 🎯 More control over what gets deployed
- 💰 Lower fees on mainnet (only one contract)
- 🔄 Update specific contracts without touching others

For detailed deployment documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🎣 Using Read & Write Hooks

### Understanding the Hook Architecture

Scaffold Stellar Plus provides a **unified, reusable hook system** that works with any contract. Instead of writing custom hooks for each contract, you use the generic `callReadMethod` and `callWriteMethod` functions.

### The `useDynamicContracts` Hook

This is your **main entry point** for contract interactions:

```typescript
import { useDynamicContracts } from '@/hooks/useDynamicContracts'

const {
  contracts,           // Array of all deployed contracts
  isLoading,          // Loading state
  error,              // Error message (if any)
  refreshContracts,   // Function to reload contracts
  addContract,        // Function to add contract by ID
  callReadMethod,     // Execute read operations
  callWriteMethod     // Execute write operations
} = useDynamicContracts()
```

---

## 📋 Practical Examples

### Example 1: Reading Contract Data (No Wallet Needed)

**Scenario**: Display the current count from the `increment` contract.

```tsx
// pages/dashboard.tsx
'use client'

import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function Dashboard() {
  const { callReadMethod } = useDynamicContracts()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCount = async () => {
    try {
      setLoading(true)
      // Call the 'get_count' method on 'increment' contract
      const result = await callReadMethod(
        'increment',     // Contract name
        'get_count',     // Method name
        {}               // Arguments (empty for this method)
      )
      setCount(result)
    } catch (error) {
      console.error('Failed to fetch count:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1>Current Count: {count ?? '???'}</h1>
      <Button onClick={fetchCount} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Count'}
      </Button>
    </div>
  )
}
```

**Key Points**:
- `callReadMethod` doesn't require wallet connection
- Works with any contract and any read method
- Returns the decoded result directly

---

### Example 2: Writing to Contract (Requires Wallet)

**Scenario**: Increment the counter with user confirmation.

```tsx
// pages/increment.tsx
'use client'

import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useWallet } from '@/hooks/useWallet'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function IncrementPage() {
  const { callReadMethod, callWriteMethod } = useDynamicContracts()
  const { isConnected, connect } = useWallet()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCount = async () => {
    const result = await callReadMethod('increment', 'get_count', {})
    setCount(result)
  }

  const incrementCounter = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    try {
      setLoading(true)
      // Call the 'increment' method (write operation)
      await callWriteMethod(
        'increment',     // Contract name
        'increment',     // Method name
        {}               // Arguments (empty for this method)
      )
      
      // Refresh the count after successful increment
      await fetchCount()
      alert('Counter incremented successfully!')
    } catch (error) {
      console.error('Failed to increment:', error)
      alert('Failed to increment counter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1>Counter: {count ?? '???'}</h1>
      <div className="flex gap-4 mt-4">
        <Button onClick={fetchCount}>Refresh</Button>
        <Button onClick={incrementCounter} disabled={loading}>
          {loading ? 'Processing...' : 'Increment'}
        </Button>
      </div>
    </div>
  )
}
```

**Key Points**:
- `callWriteMethod` requires wallet connection
- Automatically handles transaction signing via connected wallet
- Returns transaction result with hash

---

### Example 3: Method with Parameters

**Scenario**: Greet a user by name using the `hello_world` contract.

```tsx
// pages/greet.tsx
'use client'

import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function GreetPage() {
  const { callReadMethod } = useDynamicContracts()
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(false)

  const greetUser = async () => {
    try {
      setLoading(true)
      // Call 'greet' method with a parameter
      const result = await callReadMethod(
        'hello_world',         // Contract name
        'greet',               // Method name
        { to: name }           // Arguments as object
      )
      setGreeting(result)
    } catch (error) {
      console.error('Failed to greet:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1>Greet Someone</h1>
      <div className="mt-4 space-y-4">
        <Input
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={greetUser} disabled={loading || !name}>
          {loading ? 'Greeting...' : 'Get Greeting'}
        </Button>
        {greeting && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <strong>Greeting:</strong> {greeting}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Key Points**:
- Pass parameters as an object: `{ paramName: value }`
- Parameter names must match the contract method signature
- Type conversion is handled automatically

---

### Example 4: Working with Multiple Contracts

**Scenario**: Display data from multiple contracts on one page.

```tsx
// pages/overview.tsx
'use client'

import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useEffect, useState } from 'react'

export default function OverviewPage() {
  const { contracts, callReadMethod, isLoading } = useDynamicContracts()
  const [data, setData] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchAllData = async () => {
      const results: Record<string, any> = {}

      // Fetch from hello_world contract
      try {
        results.greeting = await callReadMethod('hello_world', 'hello', {})
      } catch (e) {
        console.error('Failed to fetch greeting:', e)
      }

      // Fetch from increment contract
      try {
        results.count = await callReadMethod('increment', 'get_count', {})
      } catch (e) {
        console.error('Failed to fetch count:', e)
      }

      // Fetch from token contract
      try {
        results.tokenName = await callReadMethod('token', 'name', {})
      } catch (e) {
        console.error('Failed to fetch token name:', e)
      }

      setData(results)
    }

    if (!isLoading && contracts.length > 0) {
      fetchAllData()
    }
  }, [contracts, isLoading, callReadMethod])

  return (
    <div className="p-6">
      <h1>Contract Overview</h1>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded">
          <h2>Hello World</h2>
          <p>{data.greeting || 'Loading...'}</p>
        </div>
        <div className="p-4 bg-green-100 rounded">
          <h2>Counter</h2>
          <p>{data.count ?? 'Loading...'}</p>
        </div>
        <div className="p-4 bg-purple-100 rounded">
          <h2>Token</h2>
          <p>{data.tokenName || 'Loading...'}</p>
        </div>
      </div>
    </div>
  )
}
```

**Key Points**:
- One hook instance works for all contracts
- Contracts are identified by their name (as defined in `contracts/` directory)
- Calls can be made in parallel or sequentially

---

### Example 5: Custom Hook for Specific Contract

**Scenario**: Create a reusable hook for the `increment` contract.

```typescript
// hooks/useIncrement.ts
import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useCallback, useState, useEffect } from 'react'

export function useIncrement() {
  const { callReadMethod, callWriteMethod } = useDynamicContracts()
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch current count
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true)
      const result = await callReadMethod('increment', 'get_count', {})
      setCount(result)
    } catch (error) {
      console.error('Failed to fetch count:', error)
    } finally {
      setLoading(false)
    }
  }, [callReadMethod])

  // Increment the counter
  const increment = useCallback(async () => {
    try {
      setLoading(true)
      await callWriteMethod('increment', 'increment', {})
      await fetchCount() // Refresh after write
    } catch (error) {
      console.error('Failed to increment:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [callWriteMethod, fetchCount])

  // Decrement the counter
  const decrement = useCallback(async () => {
    try {
      setLoading(true)
      await callWriteMethod('increment', 'decrement', {})
      await fetchCount() // Refresh after write
    } catch (error) {
      console.error('Failed to decrement:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [callWriteMethod, fetchCount])

  // Reset the counter
  const reset = useCallback(async () => {
    try {
      setLoading(true)
      await callWriteMethod('increment', 'reset', {})
      await fetchCount() // Refresh after write
    } catch (error) {
      console.error('Failed to reset:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [callWriteMethod, fetchCount])

  // Auto-fetch on mount
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return {
    count,
    loading,
    increment,
    decrement,
    reset,
    refresh: fetchCount
  }
}
```

**Use the custom hook** in any component:

```tsx
// pages/counter.tsx
'use client'

import { useIncrement } from '@/hooks/useIncrement'
import { Button } from '@/components/ui/Button'

export default function CounterPage() {
  const { count, loading, increment, decrement, reset } = useIncrement()

  return (
    <div className="p-6">
      <h1>Counter: {count ?? '...'}</h1>
      <div className="flex gap-4 mt-4">
        <Button onClick={decrement} disabled={loading}>-</Button>
        <Button onClick={increment} disabled={loading}>+</Button>
        <Button onClick={reset} disabled={loading} variant="destructive">
          Reset
        </Button>
      </div>
    </div>
  )
}
```

**Key Points**:
- Build contract-specific hooks on top of `useDynamicContracts`
- Encapsulate business logic and state management
- Reuse across multiple pages/components

---

### Example 6: Handling Errors Gracefully

```tsx
// pages/safe-interaction.tsx
'use client'

import { useDynamicContracts } from '@/hooks/useDynamicContracts'
import { useWallet } from '@/hooks/useWallet'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function SafeInteractionPage() {
  const { callReadMethod, callWriteMethod, error: hookError } = useDynamicContracts()
  const { isConnected, connect } = useWallet()
  const [localError, setLocalError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const safeRead = async () => {
    setLocalError(null)
    setResult(null)

    try {
      const data = await callReadMethod('increment', 'get_count', {})
      setResult(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setLocalError(`Read failed: ${message}`)
    }
  }

  const safeWrite = async () => {
    if (!isConnected) {
      setLocalError('Please connect your wallet first')
      return
    }

    setLocalError(null)
    setResult(null)

    try {
      await callWriteMethod('increment', 'increment', {})
      setResult('Success!')
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          setLocalError('Transaction was rejected by user')
        } else if (error.message.includes('Insufficient balance')) {
          setLocalError('Insufficient XLM balance for transaction')
        } else {
          setLocalError(`Write failed: ${error.message}`)
        }
      }
    }
  }

  return (
    <div className="p-6">
      <h1>Safe Contract Interaction</h1>
      
      {/* Display errors */}
      {(localError || hookError) && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
          <strong>Error:</strong> {localError || hookError}
        </div>
      )}

      {/* Display results */}
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <strong>Result:</strong> {JSON.stringify(result)}
        </div>
      )}

      <div className="flex gap-4 mt-4">
        <Button onClick={safeRead}>Safe Read</Button>
        <Button onClick={safeWrite}>Safe Write</Button>
        {!isConnected && (
          <Button onClick={connect} variant="outline">Connect Wallet</Button>
        )}
      </div>
    </div>
  )
}
```

---

## 🏗️ Project Structure

```
scaffoldstellar/
├── contracts/              # Stellar Soroban smart contracts
│   ├── hello_world/       # Example: Hello World contract
│   │   ├── src/
│   │   │   ├── lib.rs     # Contract implementation
│   │   │   └── test.rs    # Unit tests
│   │   └── Cargo.toml     # Contract dependencies
│   ├── increment/         # Example: Counter contract
│   ├── token/             # Example: Token contract
│   └── Cargo.toml         # Workspace configuration
│
├── frontend/              # Next.js 14 + TypeScript frontend
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Main contract interaction page
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ConnectWallet.tsx          # Wallet connection button
│   │   ├── ContractMethodExecutor.tsx # Individual method executor
│   │   ├── DynamicContractInterface.tsx # Contract UI interface
│   │   ├── Header.tsx                  # App header
│   │   └── ui/                         # Shadcn UI components
│   ├── hooks/            # Custom React hooks
│   │   ├── useDynamicContracts.ts     # Main contract hook
│   │   └── useWallet.ts                # Wallet management hook
│   ├── lib/              # Utility libraries
│   │   ├── contract-analyzer.ts       # Contract analysis & execution
│   │   ├── contract-map.ts            # Auto-generated import map
│   │   ├── contract-metadata.json     # Auto-generated metadata
│   │   └── stellar-wallets-kit.ts     # Wallet integration
│   ├── contracts/        # Auto-generated contract clients
│   │   └── [contract-name].ts         # Generated per contract
│   └── packages/         # Auto-generated contract bindings
│
├── scripts/              # Automation scripts
│   ├── setup.js                       # Initial setup script
│   ├── deploy-testnet.js              # Testnet deployment
│   ├── deploy-futurenet.js            # Futurenet deployment
│   ├── deploy-localnet.js             # Localnet deployment
│   ├── init-contract.js               # Create new contract
│   ├── remove-contract.js             # Remove contract
│   ├── build-contract-packages.js     # Build TypeScript packages
│   ├── generate-contract-imports.js   # Generate import map
│   ├── generate-contract-metadata.js  # Generate metadata
│   └── clean-frontend.js              # Cleanup utility
│
├── deployment.json       # Deployed contract addresses
├── package.json          # Root package.json with scripts
├── Makefile              # Make commands (alternative to yarn)
└── README.md             # This file
```

---

## 🔧 Advanced Usage

### Environment Variables

After running `yarn setup`, an `.env.local` file is created in the `frontend/` directory:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

You can customize these for different networks.

### Working with Localnet

```bash
# Start local Stellar network (in separate terminal)
stellar network start standalone

# Deploy to localnet
yarn deploy:localnet

# Update .env.local
NEXT_PUBLIC_STELLAR_NETWORK=standalone
NEXT_PUBLIC_STELLAR_RPC_URL=http://localhost:8000
```

### Type-Safe Contract Calls

For even stronger typing, you can import generated clients directly:

```typescript
import helloWorldClient from '@/contracts/hello_world'

// Type-safe method calls
const greeting = await helloWorldClient.hello({ to: 'World' })
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "No contracts found" after deployment**

```bash
# Regenerate metadata
yarn generate:metadata

# Restart dev server
yarn dev
```

**2. "Method not found" errors**

Ensure your contract is built and deployed:

```bash
yarn build:contracts
yarn deploy:testnet
```

**3. Wallet connection issues**

- Ensure Freighter extension is installed
- Check that you're on the correct network (testnet/futurenet)
- Try disconnecting and reconnecting

**4. TypeScript errors in generated files**

```bash
# Clean and rebuild
yarn clean
yarn setup
yarn deploy:testnet
```

**5. "SDK version mismatch" warnings**

The deployment script automatically fixes these, but if you see errors:

```bash
# Manually rebuild packages
yarn build:packages
```

---

## 📦 Example Contracts

### Hello World Contract

**Methods**:
- `hello() -> Symbol` - Returns "Hello"
- `greet(to: Symbol) -> Symbol` - Returns personalized greeting
- `version() -> u32` - Returns version number

### Increment Contract

**Methods**:
- `increment() -> u32` - Increments counter, returns new value
- `decrement() -> u32` - Decrements counter, returns new value
- `reset() -> u32` - Resets counter to 0
- `get_count() -> u32` - Returns current count (read-only)

### Token Contract

**Methods**:
- `initialize(admin: Address, decimals: u32, name: Symbol, symbol: Symbol)` - Initialize token
- `mint(to: Address, amount: i128)` - Mint new tokens
- `transfer(from: Address, to: Address, amount: i128)` - Transfer tokens
- `balance(address: Address) -> i128` - Get balance (read-only)
- `name() -> Symbol` - Get token name (read-only)
- `symbol() -> Symbol` - Get token symbol (read-only)
- `decimals() -> u32` - Get decimals (read-only)

---

## 📤 Publishing Your Own Scaffold

Want to create your own version of Scaffold Stellar Plus? We've made it easy to publish both as an npm package and a cargo template!

### Publishing to NPM

This allows users to run `npx your-package-name`:

```bash
cd cli
npm install
npm login
npm publish
```

### Setting Up as GitHub Template

1. Go to your repository **Settings**
2. Check **"Template repository"**
3. Users can now use `cargo generate` with your repo

**For complete publishing instructions**, see [PUBLISHING.md](./PUBLISHING.md).

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



