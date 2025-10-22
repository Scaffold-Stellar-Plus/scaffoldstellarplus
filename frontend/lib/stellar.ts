import * as Stellar from '@stellar/stellar-sdk'

export interface NetworkConfig {
  network: Stellar.Networks
  rpcUrl: string
  horizonUrl: string
  passphrase: string
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    network: Stellar.Networks.TESTNET,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: Stellar.Networks.TESTNET
  },
  futurenet: {
    network: Stellar.Networks.FUTURENET,
    rpcUrl: 'https://rpc-futurenet.stellar.org:443',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    passphrase: Stellar.Networks.FUTURENET
  },
  mainnet: {
    network: Stellar.Networks.PUBLIC,
    rpcUrl: 'https://soroban-mainnet.stellar.org:443',
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: Stellar.Networks.PUBLIC
  }
}

export interface ContractClientOptions {
  contractId: string
  rpcUrl: string
  networkPassphrase: string
  publicKey?: string
  signTransaction?: (tx: Stellar.Transaction) => Promise<Stellar.Transaction>
  allowHttp?: boolean
}

export class StellarService {
  private server: Stellar.Horizon.Server
  private network: NetworkConfig
  private keypair?: Stellar.Keypair
  private signTransaction?: (tx: Stellar.Transaction) => Promise<Stellar.Transaction>

  constructor(network: string = 'testnet') {
    this.network = NETWORKS[network] || NETWORKS.testnet
    this.server = new Stellar.Horizon.Server(this.network.horizonUrl, {
      allowHttp: this.network.network !== Stellar.Networks.PUBLIC
    })
  }

  setKeypair(keypair: Stellar.Keypair) {
    this.keypair = keypair
  }

  setSignTransaction(signTransaction: (tx: Stellar.Transaction) => Promise<Stellar.Transaction>) {
    this.signTransaction = signTransaction
  }

  getKeypair(): Stellar.Keypair | undefined {
    return this.keypair
  }

  getNetwork(): NetworkConfig {
    return this.network
  }

  async getAccount() {
    if (!this.keypair) {
      throw new Error('No keypair set')
    }
    return await this.server.loadAccount(this.keypair.publicKey())
  }

  // Enhanced contract interaction methods following CosmoUI patterns
  async createContractClient(contractId: string): Promise<ContractClientOptions> {
    if (!this.keypair) {
      throw new Error('No keypair set')
    }

    return {
      contractId,
      rpcUrl: this.network.rpcUrl,
      networkPassphrase: this.network.passphrase,
      publicKey: this.keypair.publicKey(),
      signTransaction: this.signTransaction,
      allowHttp: this.network.network !== Stellar.Networks.PUBLIC
    }
  }

  async invokeContract(
    contractId: string, 
    method: string, 
    args: any[] = []
  ): Promise<any> {
    if (!this.keypair) {
      throw new Error('No keypair set')
    }

    const account = await this.getAccount()
    const contract = new Stellar.Contract(contractId)
    
    const operation = contract.call(method, ...args)
    
    const transaction = new Stellar.TransactionBuilder(account, {
      fee: Stellar.BASE_FEE,
      networkPassphrase: this.network.passphrase
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    // Use wallet signing if available, otherwise fallback to keypair signing
    if (this.signTransaction) {
      const signedTx = await this.signTransaction(transaction)
      const response = await this.server.submitTransaction(signedTx)
      
      if (response.successful) {
        return this.parseResult(response.result_xdr)
      } else {
        throw new Error(`Transaction failed: ${response.result_xdr}`)
      }
    } else {
      transaction.sign(this.keypair)
      const response = await this.server.submitTransaction(transaction)
      
      if (response.successful) {
        return this.parseResult(response.result_xdr)
      } else {
        throw new Error(`Transaction failed: ${response.result_xdr}`)
      }
    }
  }

  async readContract(
    contractId: string, 
    method: string, 
    args: any[] = []
  ): Promise<any> {
    try {
      // For read operations, we'll use a simpler approach
      // Create a contract instance and try to call the method
      const contract = new Stellar.Contract(contractId)
      
      // Try to simulate the call by creating a transaction and submitting it
      // This is a fallback approach for read operations
      if (!this.keypair) {
        // If no keypair, create a dummy one for simulation
        const dummyKeypair = Stellar.Keypair.random()
        const dummyAccount = new Stellar.Account(dummyKeypair.publicKey(), '0')
        
        const operation = contract.call(method, ...args)
        const transaction = new Stellar.TransactionBuilder(dummyAccount, {
          fee: Stellar.BASE_FEE,
          networkPassphrase: this.network.passphrase
        })
          .addOperation(operation)
          .setTimeout(30)
          .build()

        // For read operations, we'll return a placeholder
        // In a real implementation, you'd use the contract's simulation capabilities
        return `Read operation: ${method}(${args.join(', ')})`
      } else {
        // If we have a keypair, we can try to make the call
        const account = await this.getAccount()
        const operation = contract.call(method, ...args)
        
        const transaction = new Stellar.TransactionBuilder(account, {
          fee: Stellar.BASE_FEE,
          networkPassphrase: this.network.passphrase
        })
          .addOperation(operation)
          .setTimeout(30)
          .build()

        // For read operations, we'll return a placeholder
        return `Read operation: ${method}(${args.join(', ')})`
      }
    } catch (error) {
      console.error('Read contract error:', error)
      throw new Error(`Failed to read contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private parseResult(resultXdr: string): any {
    try {
      const result = Stellar.xdr.TransactionResult.fromXDR(resultXdr, 'base64')
      const operationResults = result.result().results()
      
      if (operationResults.length > 0) {
        const operationResult = operationResults[0]
        if (operationResult.tr().invokeHostFunctionResult()) {
          const invokeResult = operationResult.tr().invokeHostFunctionResult()
          if (invokeResult.success()) {
            const success = invokeResult.success()
            if (success && (success as any).retvals && (success as any).retvals().length > 0) {
              return Stellar.scValToNative((success as any).retvals()[0])
            }
          } else {
            // Handle contract errors
            const errorResult = (invokeResult as any).error()
            if (errorResult) {
              throw new Error(`Contract execution failed: ${errorResult.toString()}`)
            }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error parsing result:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to parse contract result')
    }
  }

  // Enhanced method to get contract metadata dynamically
  async getContractMetadata(contractId: string): Promise<any> {
    try {
      // Try to read contract metadata from the contract itself
      // This is a fallback method - the main metadata comes from the generated files
      return await this.readContract(contractId, 'metadata', [])
    } catch (error) {
      console.warn('Could not read contract metadata directly:', error)
      return null
    }
  }
}

// Factory function to create a stellar service instance for a specific network
export const createStellarService = (network: string = 'testnet'): StellarService => {
  return new StellarService(network)
}

// Default singleton instance (backwards compatibility)
export const stellarService = new StellarService(process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet')

