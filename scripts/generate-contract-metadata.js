#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Script to automatically generate contract metadata from TypeScript bindings
 * This runs during build time to create dynamic contract metadata
 */

const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)

function generateContractMetadata() {
  const packagesDir = path.join(__dirname, '..', 'frontend', 'packages')
  const outputPath = path.join(__dirname, '..', 'frontend', 'lib', 'contract-metadata.json')
  
  if (!fs.existsSync(packagesDir)) {
    error('Packages directory not found')
    process.exit(1)
  }

  const contracts = {}
  let totalContracts = 0

  // Scan packages directory
  const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const packageName of packages) {
    const indexPath = path.join(packagesDir, packageName, 'src', 'index.ts')
    
    if (!fs.existsSync(indexPath)) {
      continue
    }

    try {
      const contractInfo = extractContractInfo(indexPath, packageName)
      if (contractInfo) {
        contracts[packageName] = contractInfo
        totalContracts++
      }
    } catch (err) {
      // Log error and continue with other contracts
      error(`Failed to extract info from ${packageName}`)
      if (err.message) {
        console.error('\x1b[90m' + err.message + '\x1b[0m')
      }
      if (err.stack) {
        console.error('\x1b[90m' + err.stack + '\x1b[0m')
      }
    }
  }

  // Generate final metadata
  const metadata = {
    contracts,
    totalContracts,
    generatedAt: new Date().toISOString(),
    generatedBy: 'generate-contract-metadata.js'
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write metadata file
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
  success(`Generated metadata for ${totalContracts} contracts`)
}

function extractContractInfo(filePath, packageName) {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract contract ID from networks object
  const contractIdMatch = content.match(/contractId:\s*"([^"]+)"/)
  if (!contractIdMatch) {
    error(`No contract ID found in ${packageName}`)
    return null
  }

  const contractId = contractIdMatch[1]
  
  // Extract methods from Client interface
  const methods = extractMethodsFromClientInterface(content)
  
  // Determine contract properties
  const isStateful = methods.some(m => !m.isReadOnly)
  const hasReadMethods = methods.some(m => m.isReadOnly)
  const hasWriteMethods = methods.some(m => !m.isReadOnly)

  return {
    name: packageName,
    contractId,
    path: `packages/${packageName}`,
    methods,
    isStateful,
    hasReadMethods,
    hasWriteMethods
  }
}

function extractMethodsFromClientInterface(content) {
  const methods = []
  
  // Extract the Client interface methods - use a more specific regex
  const clientInterfaceMatch = content.match(/export interface Client \{([\s\S]*?)^\}/m)
  if (!clientInterfaceMatch) {
    return methods
  }

  const interfaceContent = clientInterfaceMatch[1]
  
  // Split the content by method signatures and process each one
  const lines = interfaceContent.split('\n')
  let currentMethod = null
  let inMethod = false
  let jsdocLines = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Start of a new method (look for method name followed by colon)
    const methodMatch = line.match(/^\s*(\w+):/)
    if (methodMatch && !inMethod) {
      // Process previous method if exists
      if (currentMethod) {
        methods.push(currentMethod)
      }
      
      const methodName = methodMatch[1]
      
      // Extract description from JSDoc
      const description = extractDescriptionFromJSDoc(jsdocLines)
      
      // Find the return type by looking ahead
      let returnType = 'unknown'
      let parameters = []
      
      // Look for the return type in the next few lines
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        const returnMatch = lines[j].match(/Promise<AssembledTransaction<([^>]+)>>/)
        if (returnMatch) {
          returnType = returnMatch[1]
          // Handle incomplete return types (e.g., "Array<string" should be "Array<string>")
          if (returnType.endsWith('string') && !returnType.endsWith('string>')) {
            returnType = returnType + '>'
          }
          break
        }
        
        // Extract parameters if found
        const paramMatch = lines[j].match(/\{([^}]+)\}:\s*\{([^}]+)\}/)
        if (paramMatch) {
          parameters = extractParametersFromSignature(paramMatch[0])
        }
      }
      
      const isReadOnly = determineReadOnly(methodName, returnType)
      
      currentMethod = {
        name: methodName,
        returnType,
        parameters,
        isReadOnly,
        description
      }
      
      inMethod = true
      jsdocLines = []
    } else if (line.trim().startsWith('/**')) {
      // Start of JSDoc comment
      jsdocLines = [line]
    } else if (line.trim().startsWith('*') && jsdocLines.length > 0) {
      // Continue JSDoc comment
      jsdocLines.push(line)
    } else if (line.trim() === '*/' && jsdocLines.length > 0) {
      // End of JSDoc comment
      jsdocLines.push(line)
    } else if (inMethod && line.trim() === '') {
      // End of method (empty line)
      inMethod = false
    }
  }
  
  // Don't forget the last method
  if (currentMethod) {
    methods.push(currentMethod)
  }

  return methods
}

function extractDescriptionFromJSDoc(jsdocLines) {
  if (jsdocLines.length === 0) return undefined
  
  const descriptionLines = jsdocLines
    .map(line => line.replace(/^\s*\*\/?\s?/, '').trim())
    .filter(line => line && 
      !line.startsWith('Construct and simulate') && 
      !line.startsWith('Returns an') &&
      !line.startsWith('If this transaction changes'))
  
  return descriptionLines.length > 0 ? descriptionLines[descriptionLines.length - 1] : undefined
}

function extractParametersFromSignature(signature) {
  const parameters = []
  
  // Handle different signature formats
  if (signature.includes('options?')) {
    // Method with no parameters, just options
    return parameters
  }
  
  // Parse parameter definitions like {to}: {to: string} or {admin, decimal, name, symbol}: {admin: string, decimal: u32, name: string, symbol: string}
  const paramMatch = signature.match(/\{([^}]+)\}:\s*\{([^}]+)\}/)
  if (!paramMatch) {
    return parameters
  }
  
  const [, paramNames, typeDefinitions] = paramMatch
  
  // Split parameter names (comma-separated)
  const names = paramNames.split(',').map(name => name.trim())
  
  // Parse type definitions
  const typeRegex = /(\w+):\s*(\w+)/g
  const typeMap = {}
  let typeMatch
  
  while ((typeMatch = typeRegex.exec(typeDefinitions)) !== null) {
    const [, paramName, paramType] = typeMatch
    typeMap[paramName] = paramType
  }
  
  // Create parameters (exclude 'env' parameter as it's handled internally)
  names.forEach(name => {
    if (name !== 'env' && name !== '_env') {
      const paramType = typeMap[name] || 'unknown'
      parameters.push({
        name,
        type: paramType
      })
    }
  })

  return parameters
}

function determineReadOnly(methodName, returnType) {
  // Methods that return null are typically write operations
  if (returnType === 'null') {
    return false
  }
  
  // Common patterns for write methods (verbs that indicate state changes)
  const writePatterns = [
    // Action verbs
    /^(set|add|remove|delete|create|update|modify|change|edit|save|store|put)/i,
    /^(increment|decrement|reset|clear|init|initialize|setup)/i,
    /^(mint|burn|transfer|send|approve|allowance|deposit|withdraw)/i,
    /^(lock|unlock|enable|disable|activate|deactivate|pause|unpause)/i,
    /^(grant|revoke|claim|stake|unstake|vote|execute)/i,
    // Common admin/write method names
    /^(admin|owner|manager|configure)/i,
  ]
  
  // Check if method name matches any write pattern
  const isWriteMethod = writePatterns.some(pattern => pattern.test(methodName))
  if (isWriteMethod) {
    return false
  }
  
  // Common patterns for read methods (getters, queries)
  const readPatterns = [
    /^(get|fetch|read|query|check|is|has|can|should|verify)/i,
    /^(balance|name|symbol|decimals|total|count|amount|price|rate)/i,
    /^(owner|admin|config|setting|status|state|info)/i,
  ]
  
  // Check if method name matches any read pattern
  const isReadMethod = readPatterns.some(pattern => pattern.test(methodName))
  if (isReadMethod) {
    return true
  }
  
  // Default: if it returns a value and doesn't match write patterns, it's likely a read operation
  return true
}

// Run the generator
if (require.main === module) {
  generateContractMetadata()
}

module.exports = { generateContractMetadata }
