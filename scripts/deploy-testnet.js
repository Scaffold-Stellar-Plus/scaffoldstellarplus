#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { analyzeContractConstructor, collectConstructorArgs } = require('./contract-analyzer')

// Clean logging with emojis and colors
const log = (message) => console.log(`\x1b[36m${message}\x1b[0m`)
const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)
const info = (message) => console.log(`\x1b[33m📋 ${message}\x1b[0m`)
const step = (message) => console.log(`\n\x1b[1;36m▶ ${message}\x1b[0m`)

// Progress spinner with minimum display time
let spinnerInterval
let spinnerStartTime
const MINIMUM_SPINNER_DISPLAY_MS = 1000 // Ensure spinner shows for at least 1 second

const startSpinner = (text) => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  spinnerStartTime = Date.now()
  process.stdout.write('\x1b[?25l') // Hide cursor
  
  // Immediately display first frame
  process.stdout.write(`\r\x1b[36m${frames[0]} ${text}\x1b[0m`)
  
  // Then animate through remaining frames
  spinnerInterval = setInterval(() => {
    i = (i + 1) % frames.length
    process.stdout.write(`\r\x1b[36m${frames[i]} ${text}\x1b[0m`)
  }, 80)
}

const stopSpinner = async (successText) => {
  // Ensure spinner displays for minimum time (better UX for fast operations)
  const elapsed = Date.now() - spinnerStartTime
  if (elapsed < MINIMUM_SPINNER_DISPLAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MINIMUM_SPINNER_DISPLAY_MS - elapsed))
  }
  
  clearInterval(spinnerInterval)
  process.stdout.write('\r\x1b[K') // Clear line
  process.stdout.write('\x1b[?25h') // Show cursor
  if (successText) success(successText)
}

const checkPrerequisites = async () => {
  startSpinner('Checking prerequisites...')
  
  try {
    execSync('stellar --version', { stdio: 'pipe' })
    execSync('rustup target list | grep "wasm32v1-none (installed)"', { stdio: 'pipe' })
    execSync('curl -s --connect-timeout 5 https://soroban-testnet.stellar.org:443 > /dev/null', { stdio: 'pipe' })
    execSync('stellar keys ls | grep alice', { stdio: 'pipe' })
    await stopSpinner('Prerequisites verified')
  } catch (err) {
    await stopSpinner()
    error('Prerequisites check failed. Run "yarn setup" first.')
    
    // Log detailed error information
    if (err.stderr) {
      console.error('\x1b[90mStderr:\x1b[0m')
      console.error('\x1b[90m' + err.stderr.toString() + '\x1b[0m')
    }
    if (err.message) {
      console.error('\x1b[90m' + err.message + '\x1b[0m')
    }
    
    process.exit(1)
  }
}

const buildContracts = () => {
  return new Promise((resolve, reject) => {
    // Enhanced spinner with progress updates for long build
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let i = 0
    let seconds = 0
    process.stdout.write('\x1b[?25l') // Hide cursor
    
    // Immediately show first frame
    process.stdout.write(`\r\x1b[36m${frames[0]} Building contracts... This may take up to a minute\x1b[0m`)
    
    // Animate spinner
    const buildSpinner = setInterval(() => {
      i = (i + 1) % frames.length
      const timeMsg = seconds > 0 ? ` (${seconds}s)` : ''
      process.stdout.write(`\r\x1b[36m${frames[i]} Building contracts${timeMsg}... This may take up to a minute\x1b[0m`)
      
      // Update seconds counter every 10 frames (roughly 1 second)
      if (i === 0) seconds++
    }, 100)
    
    // Use spawn instead of execSync so event loop continues (spinner can animate)
    const build = spawn('cargo', ['build', '--target', 'wasm32v1-none', '--release'], {
      cwd: 'contracts',
      stdio: 'pipe'
    })
    
    let stderr = ''
    
    build.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    build.on('close', (code) => {
      clearInterval(buildSpinner)
      process.stdout.write('\r\x1b[K') // Clear line
      process.stdout.write('\x1b[?25h') // Show cursor
      
      if (code === 0) {
        success(`Contracts built successfully (${seconds}s)`)
        resolve()
      } else {
        error('Failed to build contracts')
        if (stderr) {
          console.error('\x1b[90m' + stderr + '\x1b[0m')
        }
        reject(new Error('Build failed'))
      }
    })
    
    build.on('error', (err) => {
      clearInterval(buildSpinner)
      process.stdout.write('\r\x1b[K') // Clear line
      process.stdout.write('\x1b[?25h') // Show cursor
      error('Failed to build contracts')
      console.error('\x1b[90m' + err.message + '\x1b[0m')
      reject(err)
    })
  })
}

const detectContracts = () => {
  const contractsDir = 'contracts'
  const contracts = []
  
  if (!fs.existsSync(contractsDir)) {
    error('Contracts directory not found')
    return []
  }
  
  const items = fs.readdirSync(contractsDir)
  
  items.forEach(item => {
    const itemPath = path.join(contractsDir, item)
    const stat = fs.statSync(itemPath)
    
    if (stat.isDirectory()) {
      const cargoTomlPath = path.join(itemPath, 'Cargo.toml')
      const srcPath = path.join(itemPath, 'src')
      
      if (fs.existsSync(cargoTomlPath) && fs.existsSync(srcPath)) {
        contracts.push({
          name: item,
          path: itemPath
        })
      }
    }
  })
  
  info(`Found ${contracts.length} contracts: ${contracts.map(c => c.name).join(', ')}`)
  return contracts
}

const deployContract = async (contractName, wasmPath, contractPath) => {
  startSpinner(`Deploying ${contractName}...`)
  
  try {
    // Check if WASM file exists
    if (!fs.existsSync(wasmPath)) {
      await stopSpinner()
      error(`WASM file not found: ${wasmPath}`)
      return null
    }
    
    // Upload contract
    const uploadOutput = execSync(
      `stellar contract upload --network testnet --source alice --wasm ${wasmPath}`,
      { encoding: 'utf8', stdio: 'pipe' }
    )
    
    const wasmHash = uploadOutput.trim()
    if (!wasmHash || wasmHash.length === 0) {
      await stopSpinner()
      error(`Invalid wasm hash received for ${contractName}`)
      return null
    }
    
    // Analyze constructor arguments
    const constructorAnalysis = analyzeContractConstructor(contractPath)
    let constructorArgs = ''
    
    if (constructorAnalysis && constructorAnalysis.hasConstructor) {
      await stopSpinner() // Stop spinner to allow user interaction
      constructorArgs = await collectConstructorArgs(contractName, constructorAnalysis.args)
      startSpinner(`Deploying ${contractName} with constructor arguments...`)
    }
    
    // Deploy contract with constructor arguments
    const deployCmd = `stellar contract deploy --wasm-hash ${wasmHash} --source alice --network testnet --alias ${contractName}${constructorArgs ? ' -- ' + constructorArgs : ''}`
    
    const deployOutput = execSync(
      deployCmd,
      { encoding: 'utf8', stdio: 'pipe' }
    )
    
    const contractId = deployOutput.trim()
    if (!contractId || contractId.length === 0) {
      await stopSpinner()
      error(`Invalid contract ID received for ${contractName}`)
      return null
    }
    
    await stopSpinner(`${contractName} deployed: ${contractId.substring(0, 8)}...`)
    
    return { wasmHash, contractId }
  } catch (err) {
    await stopSpinner()
    error(`Failed to deploy ${contractName}`)
    
    // Log detailed error information
    if (err.stderr) {
      console.error('\x1b[90mStderr:\x1b[0m')
      console.error('\x1b[90m' + err.stderr.toString() + '\x1b[0m')
    }
    if (err.stdout) {
      console.error('\x1b[90mStdout:\x1b[0m')
      console.error('\x1b[90m' + err.stdout.toString() + '\x1b[0m')
    }
    if (err.message && !err.stderr && !err.stdout) {
      console.error('\x1b[90m' + err.message + '\x1b[0m')
    }
    
    return null
  }
}

const generateContractBindings = async (contracts) => {
  return new Promise(async (resolve, reject) => {
    // Enhanced spinner with progress for bindings generation
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let i = 0
    let seconds = 0
    const contractCount = Object.keys(contracts).length
    let currentContract = 0
    
    process.stdout.write('\x1b[?25l') // Hide cursor
    
    // Immediately show first frame
    process.stdout.write(`\r\x1b[36m${frames[0]} Generating TypeScript bindings (0/${contractCount})...\x1b[0m`)
    
    const bindingsSpinner = setInterval(() => {
      i = (i + 1) % frames.length
      const progress = `(${currentContract}/${contractCount})`
      const timeMsg = seconds > 5 ? ` ${seconds}s` : ''
      process.stdout.write(`\r\x1b[36m${frames[i]} Generating TypeScript bindings ${progress}${timeMsg}...\x1b[0m`)
      if (i === 0) seconds++
    }, 80)
    
    try {
      // Create packages directory if it doesn't exist
      if (!fs.existsSync('frontend/packages')) {
        fs.mkdirSync('frontend/packages', { recursive: true })
      }
      
      // Generate bindings for each contract sequentially with network-specific directories
      for (const [contractName, contractInfo] of Object.entries(contracts)) {
        currentContract++
        const outputDir = `frontend/packages/${contractName}-testnet`
        
        try {
          // Try without overwrite first
          execSync(
            `stellar contract bindings typescript --network testnet --contract-id ${contractInfo.contractId} --output-dir ${outputDir}`,
            { stdio: 'pipe' }
          )
        } catch (bindingsErr) {
          // If directory exists, try with overwrite
          const errorMessage = bindingsErr.message || bindingsErr.stdout || bindingsErr.stderr || ''
          if (errorMessage.includes('already exists')) {
            execSync(
              `stellar contract bindings typescript --network testnet --contract-id ${contractInfo.contractId} --output-dir ${outputDir} --overwrite`,
              { stdio: 'pipe' }
            )
          } else {
            throw bindingsErr
          }
        }
        
        // Fix stellar-sdk version to 14.0.0 (CLI generates with ^13.x by default)
        fixPackageJsonVersion(outputDir, contractName, 'testnet')
      }
      
      clearInterval(bindingsSpinner)
      process.stdout.write('\r\x1b[K') // Clear line
      process.stdout.write('\x1b[?25h') // Show cursor
      success(`Generated bindings for ${contractCount} contracts (${seconds}s)`)
      resolve()
    } catch (err) {
      clearInterval(bindingsSpinner)
      process.stdout.write('\r\x1b[K') // Clear line
      process.stdout.write('\x1b[?25h') // Show cursor
      error(`Failed to generate contract bindings`)
      console.error('\x1b[90m' + (err.stderr?.toString() || err.message) + '\x1b[0m')
      reject(err)
    }
  })
}

const fixPackageJsonVersion = (packageDir, contractName, network) => {
  try {
    const packageJsonPath = path.join(packageDir, 'package.json')
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      // Update package name to include network
      packageJson.name = `${contractName}-${network}`
      
      // Update stellar-sdk version to 14.0.0
      if (packageJson.dependencies && packageJson.dependencies['@stellar/stellar-sdk']) {
        packageJson.dependencies['@stellar/stellar-sdk'] = '14.0.0'
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')
      }
    }
  } catch (err) {
    // Silently fail - not critical
  }
}


const generateEnvFile = (contracts) => {
  const envContent = `# Auto-generated by deployment script
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org:443
${Object.entries(contracts).map(([name, info]) => 
  `NEXT_PUBLIC_${name.toUpperCase()}_CONTRACT_ID=${info.contractId}`
).join('\n')}
`
  
  // Write to root directory
  fs.writeFileSync('.env.local', envContent)
  
  // Also write to frontend directory for Next.js
  fs.writeFileSync('frontend/.env.local', envContent)
}

const generateDeploymentInfo = (contracts) => {
  const deploymentInfo = {
    network: 'testnet',
    timestamp: new Date().toISOString(),
    contracts: Object.fromEntries(
      Object.entries(contracts).map(([name, info]) => [
        name,
        {
          contractId: info.contractId,
          wasmHash: info.wasmHash
        }
      ])
    )
  }
  
  fs.writeFileSync(
    'deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  )
}

const main = async () => {
  // Check for specific contract argument
  const specificContract = process.argv[2]
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                ║')
  console.log('║              🚀 Deploying to Stellar Testnet 🚀                ║')
  if (specificContract) {
    console.log(`║                   Contract: ${specificContract.padEnd(33)}║`)
  }
  console.log('║                                                                ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  const startTime = Date.now()
  
  try {
    step('Step 1: Checking prerequisites')
    await checkPrerequisites()
    
    step('Step 2: Building contracts')
    await buildContracts()
    
    step('Step 3: Detecting contracts')
    let detectedContracts = detectContracts()
    
    // Filter for specific contract if provided
    if (specificContract) {
      const originalCount = detectedContracts.length
      detectedContracts = detectedContracts.filter(c => c.name === specificContract)
      
      if (detectedContracts.length === 0) {
        error(`Contract "${specificContract}" not found`)
        info(`Available contracts: ${detectContracts().map(c => c.name).join(', ')}`)
        process.exit(1)
      }
      
      info(`Deploying specific contract: ${specificContract} (${detectedContracts.length} of ${originalCount})`)
    }
    
    if (detectedContracts.length === 0) {
      error('No contracts found to deploy')
      process.exit(1)
    }
    
    const contracts = {}
    
    step('Step 4: Deploying contracts')
    const failedContracts = []
    for (const contract of detectedContracts) {
      const wasmPath = `contracts/target/wasm32v1-none/release/${contract.name}.wasm`
      const result = await deployContract(contract.name, wasmPath, contract.path)
      if (result) {
        contracts[contract.name] = result
      } else {
        failedContracts.push(contract.name)
      }
    }
    
    if (Object.keys(contracts).length === 0) {
      error('No contracts were successfully deployed')
      process.exit(1)
    }
    
    step('Step 5: Generating TypeScript bindings')
    await generateContractBindings(contracts)
    
    step('Step 6: Configuring environment')
    startSpinner('Saving configuration files...')
    generateEnvFile(contracts)
    generateDeploymentInfo(contracts)
    await stopSpinner('Configuration files created')
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║                                                                ║')
    console.log('║                   ✅ Deployment Complete! ✅                    ║')
    console.log('║                                                                ║')
    console.log('╚════════════════════════════════════════════════════════════════╝\n')
    
    console.log(`\x1b[1;32m🎉 Successfully deployed ${Object.keys(contracts).length} contract(s) in ${elapsedTime}s\x1b[0m\n`)
    
    console.log('\x1b[1m📋 Deployed Contracts:\x1b[0m')
    Object.entries(contracts).forEach(([name, info]) => {
      console.log(`   \x1b[36m${name}\x1b[0m`)
      console.log(`      ID: \x1b[90m${info.contractId}\x1b[0m`)
    })
    
    if (failedContracts.length > 0) {
      console.log(`\n\x1b[33m⚠️  Failed contracts: ${failedContracts.join(', ')}\x1b[0m`)
    }
    
    console.log('\n\x1b[1m📦 Next Steps:\x1b[0m')
    if (specificContract) {
      console.log('   Run post-deployment: \x1b[36myarn post-deploy\x1b[0m')
      console.log('   Then start frontend: \x1b[36myarn dev\x1b[0m\n')
    } else {
      console.log('   1. Build packages:  \x1b[36myarn build:packages\x1b[0m')
      console.log('   2. Generate imports: \x1b[36myarn generate:contract-imports\x1b[0m')
      console.log('   3. Generate metadata: \x1b[36myarn generate:metadata\x1b[0m')
      console.log('   4. Start frontend:   \x1b[36myarn dev\x1b[0m\n')
      console.log('\x1b[90m💡 Or run all post-deployment steps: yarn post-deploy\x1b[0m\n')
    }
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`)
    
    // Log detailed error information
    if (err.stderr) {
      console.error('\x1b[90mStderr:\x1b[0m')
      console.error('\x1b[90m' + err.stderr.toString() + '\x1b[0m')
    }
    if (err.stdout) {
      console.error('\x1b[90mStdout:\x1b[0m')
      console.error('\x1b[90m' + err.stdout.toString() + '\x1b[0m')
    }
    if (err.stack && !err.stderr && !err.stdout) {
      console.error('\x1b[90m' + err.stack + '\x1b[0m')
    }
    
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
