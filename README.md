# ScaffoldStellar

A fullstack Stellar smart contract and frontend boilerplate that bootstraps both Stellar Soroban smart contract development and a Next.js + TypeScript frontend with seamless integration. Features **dynamic contract detection**, **multi-wallet support**, and **zero-configuration setup** for rapid development.

## 🚀 Quick Start

```bash
# Install dependencies and setup
yarn setup

# Auto-deploy all contracts with TypeScript bindings
yarn deploy:testnet

# Start development server
yarn dev
```

## 📁 Project Structure

```
scaffoldstellar/
├── contracts/           # Stellar Soroban smart contracts
│   ├── hello_world/    # Hello World example contract
│   ├── increment/      # Increment counter example contract
│   └── token/          # Token contract example
├── frontend/           # Next.js 14 + TypeScript frontend
│   ├── packages/       # Auto-generated contract bindings
│   ├── lib/           # Dynamic contract analyzer & services
│   └── components/    # Interactive contract UI components
├── scripts/           # Deployment and utility scripts
│   ├── deploy-*.js    # Network-specific deployment scripts
│   └── generate-contract-metadata.js # Dynamic metadata generator
├── docs/             # Comprehensive documentation
└── .env.local        # Environment configuration (auto-generated)
```

## 🛠️ Features

### 🔥 Core Features
- **Smart Contracts**: Pre-configured Stellar Soroban contracts (Hello World, Increment, Token)
- **Frontend**: Next.js 14 with App Router, TypeScript, and TailwindCSS
- **Multi-Wallet Support**: Freighter, Albedo, XBull, and other Stellar wallets via `@creit.tech/stellar-wallets-kit`
- **Dynamic Contract Detection**: Automatically discovers and adapts to any contract structure
- **🎉 100% Zero-Configuration**: Add new contracts without touching ANY frontend code - automatic detection, classification, and UI generation!

### 🚀 Advanced Features
- **Dynamic Metadata Generation**: Auto-generates contract metadata from TypeScript bindings
- **Smart Read/Write Detection**: Pattern-based automatic classification of contract methods
- **Auto-Generated Contract Maps**: Dynamic import mapping for all contracts (zero manual updates)
- **Interactive Contract Interface**: Automatically creates UI components for all contract methods
- **Type-Safe Interactions**: Full TypeScript support with auto-generated contract bindings
- **Network Flexibility**: Deploy to localnet, testnet, or futurenet with simple commands
- **Hot Reload Development**: Instant updates during development
- **Enhanced Loading States**: Animated spinners with elapsed time for all long operations - never a frozen terminal!
- **Comprehensive Error Handling**: Robust error handling and user feedback

## 📚 Documentation

### 🆕 Zero-Configuration System
- **[ZERO_CONFIG_QUICK_START.md](./ZERO_CONFIG_QUICK_START.md)** - 30-second guide to adding contracts (start here!)
- **[ZERO_CONFIG_IMPLEMENTATION.md](./ZERO_CONFIG_IMPLEMENTATION.md)** - Complete technical details & benefits
- **[HARDCODED_CONTRACT_INFO.md](./HARDCODED_CONTRACT_INFO.md)** - What was hardcoded & how it was solved

### 📖 General Documentation
See the [docs/](./docs/) folder for comprehensive documentation including:
- [Quick Start Guide](./docs/quick-start.md) - Get up and running in minutes
- [Development Guide](./docs/development.md) - Complete development workflow
- [Usage Guide](./docs/usage.md) - How to use the deployed application
- [Dynamic Contract System](./docs/auto-adaptation.md) - Dynamic contract detection and UI generation
- [Dynamic Metadata System](./docs/dynamic-metadata.md) - Contract metadata generation and analysis
- [Enhanced Loading States](./ENHANCED_LOADING_STATES.md) - Animated spinners and progress indicators
- [Examples](./docs/examples.md) - Code examples and use cases

## 🔧 Development

### Prerequisites

- Rust toolchain with `wasm32v1-none` target
- Stellar CLI
- Node.js 18+ and Yarn
- A Stellar wallet (Freighter recommended)

### Setup

1. **Install Prerequisites**:
   - Rust toolchain with `wasm32v1-none` target
   - [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
   - Node.js 18+ and Yarn
   - A Stellar wallet (Freighter recommended)

2. **Clone and Setup**:
   ```bash
   git clone <your-repo>
   cd scaffoldstellar
   yarn setup  # Installs dependencies, creates identities, and builds contracts
   ```

3. **Deploy Contracts**:
   ```bash
   yarn deploy:testnet  # Deploys all contracts and generates bindings
   ```

4. **Start Development**:
   ```bash
   yarn dev  # Starts the development server with auto-reload
   ```

## 🎯 Dynamic Contract System

### 🔍 Automatic Contract Detection
ScaffoldStellar automatically detects any contract in the `contracts/` directory and:
- **Scans TypeScript Bindings**: Extracts method signatures from generated bindings
- **Generates Metadata**: Creates comprehensive contract metadata automatically
- **Creates Interactive UI**: Builds forms and components for all contract methods
- **Supports Read/Write Operations**: Separates read-only queries from state-changing transactions

### 🎨 Dynamic Frontend Generation
The frontend automatically adapts to any deployed contract:
- **Method Discovery**: Automatically finds all contract methods and parameters
- **Type Inference**: Intelligently determines parameter types from TypeScript bindings
- **UI Generation**: Creates interactive forms with proper validation
- **Wallet Integration**: Seamlessly handles transaction signing and submission
- **Error Handling**: Provides clear feedback for all operations

### ⚡ Zero-Configuration Workflow
```bash
# 1. Add a new contract to contracts/my_contract/
# 2. Deploy with automatic binding generation
yarn deploy:testnet

# 3. The frontend automatically adapts to your new contract!
# The deployment process automatically:
#    - Builds contract packages (TypeScript bindings)
#    - Auto-fixes Stellar SDK versions (^13.x → 14.0.0)
#    - Generates contract import files in frontend/contracts/
#    - Updates contract metadata for dynamic UI
# No manual code changes required - everything is generated automatically!
```

### 🔧 Available Scripts
```bash
yarn setup                      # Complete project setup
yarn dev                        # Start development server with metadata generation
yarn build                      # Build contracts and frontend
yarn deploy:testnet             # Deploy to Stellar testnet
yarn deploy:futurenet           # Deploy to Stellar futurenet
yarn deploy:localnet            # Deploy to local Stellar network
yarn build:packages             # Build contract packages (generates dist folders)
yarn generate:contract-imports  # Auto-generate contract import files
yarn generate:metadata          # Regenerate contract metadata
yarn detect:contracts           # Detect and analyze contracts
yarn clean                      # Remove build artifacts & auto-generated files
yarn clean:frontend             # Remove only frontend auto-generated files
yarn clean:all                  # Deep clean (includes node_modules)
```

## 📖 Included Examples

### Smart Contracts
- **Hello World**: Simple greeting contract with multiple methods (`hello`, `greet`, `version`)
- **Increment**: Counter contract with state management (`increment`, `decrement`, `reset`, `get_count`)
- **Token**: ERC-20-like token with full functionality (`initialize`, `mint`, `transfer`, `balance`, `name`, `symbol`, `decimals`)

### Frontend Features
- **Dynamic Contract Interface**: Automatically generated UI for all contract methods
- **Multi-Wallet Support**: Connect with Freighter, Albedo, XBull, and other Stellar wallets
- **Interactive Forms**: Type-safe parameter input with validation
- **Real-time Feedback**: Transaction status, errors, and results
- **Responsive Design**: Works on desktop and mobile devices

### Development Tools
- **Hot Reload**: Instant updates during development
- **Type Safety**: Full TypeScript support with auto-generated types
- **Error Handling**: Comprehensive error reporting and debugging
- **Network Flexibility**: Easy switching between testnet, futurenet, and localnet

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📄 License

MIT License - see LICENSE file for details.
