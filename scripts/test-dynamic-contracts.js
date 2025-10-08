#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const log = (message) => {
  console.log(`\n\x1b[1;32m[LOG] ${message}\x1b[0m`)
}

const error = (message) => {
  console.error(`\x1b[1;31m[ERROR] ${message}\x1b[0m`)
}

const success = (message) => {
  console.log(`\x1b[1;32m[SUCCESS] ${message}\x1b[0m`)
}

/**
 * Test script to verify the dynamic contract system
 */

function testDynamicContractSystem() {
  log('Testing dynamic contract system...')
  
  const tests = [
    testContractPackages,
    testContractClients,
    testEnvironmentVariables,
    testContractMetadata,
    testFrontendFiles
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  for (const test of tests) {
    try {
      if (test()) {
        passedTests++
      }
    } catch (err) {
      error(`Test failed: ${err.message}`)
    }
  }
  
  log(`Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    success('All tests passed! Dynamic contract system is ready.')
    return true
  } else {
    error('Some tests failed. Please check the issues above.')
    return false
  }
}

function testContractPackages() {
  log('Testing contract packages...')
  
  const packagesDir = path.join(__dirname, '..', 'frontend', 'packages')
  
  if (!fs.existsSync(packagesDir)) {
    error('Packages directory not found')
    return false
  }
  
  const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  if (packages.length === 0) {
    error('No contract packages found')
    return false
  }
  
  log(`Found ${packages.length} packages: ${packages.join(', ')}`)
  
  for (const packageName of packages) {
    const packagePath = path.join(packagesDir, packageName)
    const distPath = path.join(packagePath, 'dist')
    const indexPath = path.join(distPath, 'index.js')
    
    if (!fs.existsSync(distPath)) {
      error(`Dist folder not found for ${packageName}`)
      return false
    }
    
    if (!fs.existsSync(indexPath)) {
      error(`Built index.js not found for ${packageName}`)
      return false
    }
  }
  
  success('All contract packages are built correctly')
  return true
}

function testContractClients() {
  log('Testing contract clients...')
  
  const clientsDir = path.join(__dirname, '..', 'frontend', 'lib', 'clients')
  
  if (!fs.existsSync(clientsDir)) {
    error('Clients directory not found')
    return false
  }
  
  const configPath = path.join(clientsDir, 'config.ts')
  const factoryPath = path.join(clientsDir, 'contract-client-factory.ts')
  const indexPath = path.join(clientsDir, 'index.ts')
  
  const requiredFiles = [configPath, factoryPath, indexPath]
  
  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      error(`Required client file not found: ${path.basename(filePath)}`)
      return false
    }
  }
  
  success('All contract client files exist')
  return true
}

function testEnvironmentVariables() {
  log('Testing environment variables...')
  
  const envPath = path.join(__dirname, '..', '.env.local')
  
  if (!fs.existsSync(envPath)) {
    error('Environment file not found')
    return false
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8')
  
  if (!envContent.includes('NEXT_PUBLIC_')) {
    error('No NEXT_PUBLIC_ environment variables found')
    return false
  }
  
  const contractVars = envContent.match(/NEXT_PUBLIC_\w+_CONTRACT_ID/g)
  
  if (!contractVars || contractVars.length === 0) {
    error('No contract ID environment variables found')
    return false
  }
  
  log(`Found ${contractVars.length} contract environment variables`)
  
  success('Environment variables are configured correctly')
  return true
}

function testContractMetadata() {
  log('Testing contract metadata...')
  
  const metadataPath = path.join(__dirname, '..', 'frontend', 'lib', 'contract-metadata.json')
  
  if (!fs.existsSync(metadataPath)) {
    error('Contract metadata file not found')
    return false
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  
  if (!metadata.contracts || Object.keys(metadata.contracts).length === 0) {
    error('No contracts found in metadata')
    return false
  }
  
  const contractNames = Object.keys(metadata.contracts)
  log(`Found metadata for ${contractNames.length} contracts: ${contractNames.join(', ')}`)
  
  // Check each contract has required fields
  for (const [name, contract] of Object.entries(metadata.contracts)) {
    if (!contract.contractId) {
      error(`Contract ${name} missing contractId`)
      return false
    }
    
    if (!contract.methods || !Array.isArray(contract.methods)) {
      error(`Contract ${name} missing methods array`)
      return false
    }
    
    const readMethods = contract.methods.filter(m => m.isReadOnly)
    if (readMethods.length === 0) {
      log(`Warning: Contract ${name} has no read methods`)
    }
  }
  
  success('Contract metadata is valid')
  return true
}

function testFrontendFiles() {
  log('Testing frontend files...')
  
  const frontendFiles = [
    'hooks/useContractRead.ts',
    'components/DynamicContractReader.tsx',
    'components/ContractInitializer.tsx',
    'components/ClientOnly.tsx',
    'components/ui/Tabs.tsx',
    'lib/contract-initializer.ts',
    'app/contracts/page.tsx'
  ]
  
  for (const filePath of frontendFiles) {
    const fullPath = path.join(__dirname, '..', 'frontend', filePath)
    
    if (!fs.existsSync(fullPath)) {
      error(`Frontend file not found: ${filePath}`)
      return false
    }
  }
  
  success('All required frontend files exist')
  return true
}

// Run the tests
if (require.main === module) {
  testDynamicContractSystem()
}

module.exports = { testDynamicContractSystem }
