import { 
  Networks, 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  BASE_FEE,
  Asset,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr
} from '@stellar/stellar-sdk'

export interface NetworkConfig {
  network: Networks
  rpcUrl: string
  horizonUrl: string
  passphrase: string
}

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    network: Networks.TESTNET,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: Networks.TESTNET
  },
  futurenet: {
    network: Networks.FUTURENET,
    rpcUrl: 'https://rpc-futurenet.stellar.org:443',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    passphrase: Networks.FUTURENET
  },
  mainnet: {
    network: Networks.PUBLIC,
    rpcUrl: 'https://soroban-mainnet.stellar.org:443',
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: Networks.PUBLIC
  }
}

export class StellarService {
  private server: Server
  private network: NetworkConfig
  private keypair?: Keypair

  constructor(network: string = 'testnet') {
    this.network = NETWORKS[network] || NETWORKS.testnet
    this.server = new Server(this.network.horizonUrl, {
      allowHttp: this.network.network !== Networks.PUBLIC
    })
  }

  setKeypair(keypair: Keypair) {
    this.keypair = keypair
  }

  getKeypair(): Keypair | undefined {
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

  async invokeContract(
    contractId: string, 
    method: string, 
    args: any[] = []
  ): Promise<any> {
    if (!this.keypair) {
      throw new Error('No keypair set')
    }

    const account = await this.getAccount()
    const contract = new Contract(contractId)
    
    const operation = contract.call(method, ...args)
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.passphrase
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    transaction.sign(this.keypair)

    const response = await this.server.submitTransaction(transaction)
    
    if (response.successful) {
      return this.parseResult(response.resultXdr)
    } else {
      throw new Error(`Transaction failed: ${response.resultXdr}`)
    }
  }

  async readContract(
    contractId: string, 
    method: string, 
    args: any[] = []
  ): Promise<any> {
    const contract = new Contract(contractId)
    const operation = contract.call(method, ...args)
    
    const response = await this.server.simulateTransaction(
      new TransactionBuilder(await this.server.getAccount(contractId), {
        fee: BASE_FEE,
        networkPassphrase: this.network.passphrase
      })
        .addOperation(operation)
        .setTimeout(30)
        .build()
    )

    if (response.successful) {
      return this.parseResult(response.resultXdr)
    } else {
      throw new Error(`Simulation failed: ${response.resultXdr}`)
    }
  }

  private parseResult(resultXdr: string): any {
    try {
      const result = xdr.TransactionResult.fromXDR(resultXdr, 'base64')
      const operationResults = result.result().results()
      
      if (operationResults.length > 0) {
        const operationResult = operationResults[0]
        if (operationResult.tr().invokeHostFunctionResult()) {
          const invokeResult = operationResult.tr().invokeHostFunctionResult()
          if (invokeResult.success()) {
            const success = invokeResult.success()
            if (success.retvals().length > 0) {
              return scValToNative(success.retvals()[0])
            }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error parsing result:', error)
      return null
    }
  }

  async deployContract(wasmPath: string, initArgs: any[] = []): Promise<string> {
    if (!this.keypair) {
      throw new Error('No keypair set')
    }

    const account = await this.getAccount()
    
    // Upload contract
    const uploadOperation = Operation.uploadContractWasm({
      wasm: Buffer.from(wasmPath, 'base64')
    })

    const uploadTransaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.passphrase
    })
      .addOperation(uploadOperation)
      .setTimeout(30)
      .build()

    uploadTransaction.sign(this.keypair)
    const uploadResponse = await this.server.submitTransaction(uploadTransaction)

    if (!uploadResponse.successful) {
      throw new Error(`Upload failed: ${uploadResponse.resultXdr}`)
    }

    // Deploy contract
    const deployOperation = Operation.createContract({
      contractId: uploadResponse.resultXdr,
      wasmId: uploadResponse.resultXdr
    })

    const deployTransaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network.passphrase
    })
      .addOperation(deployOperation)
      .setTimeout(30)
      .build()

    deployTransaction.sign(this.keypair)
    const deployResponse = await this.server.submitTransaction(deployTransaction)

    if (!deployResponse.successful) {
      throw new Error(`Deploy failed: ${deployResponse.resultXdr}`)
    }

    return deployResponse.resultXdr
  }
}

// Singleton instance
export const stellarService = new StellarService(process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet')

