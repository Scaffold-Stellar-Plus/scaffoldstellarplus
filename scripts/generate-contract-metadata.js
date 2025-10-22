#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Script to automatically generate contract metadata from TypeScript bindings
 * This runs during build time to create dynamic contract metadata
 */

const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)

/**
 * Parse package name to extract contract name and network
 */
function parsePackageName(packageName) {
  const parts = packageName.split('-');
  const possibleNetworks = ['testnet', 'mainnet', 'futurenet'];
  const lastPart = parts[parts.length - 1];
  
  if (possibleNetworks.includes(lastPart)) {
    return {
      contract: parts.slice(0, -1).join('-'),
      network: lastPart
    };
  }
  
  // Fallback for packages without network suffix (legacy support)
  return {
    contract: packageName,
    network: 'unknown'
  };
}

function generateContractMetadata() {
  const packagesDir = path.join(__dirname, '..', 'frontend', 'packages')
  const outputPath = path.join(__dirname, '..', 'frontend', 'lib', 'contract-metadata.json')
  
  if (!fs.existsSync(packagesDir)) {
    error('Packages directory not found')
    process.exit(1)
  }

  const contractsByNetwork = {
    testnet: {},
    mainnet: {},
    futurenet: {}
  }
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
      const { contract, network } = parsePackageName(packageName)
      const contractInfo = extractContractInfo(indexPath, packageName, contract, network)
      
      if (contractInfo && contractsByNetwork[network]) {
        contractsByNetwork[network][contract] = contractInfo
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

  // Generate final metadata with network separation
  const metadata = {
    contracts: contractsByNetwork,
    totalContracts,
    generatedAt: new Date().toISOString(),
    generatedBy: 'generate-contract-metadata.js',
    version: '2.0.0', // Network-aware version
    description: 'Network-separated contract metadata'
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write metadata file
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
  
  // Log network statistics
  const networkStats = Object.entries(contractsByNetwork)
    .map(([net, contracts]) => `${net}: ${Object.keys(contracts).length}`)
    .join(', ')
  
  success(`Generated metadata for ${totalContracts} contracts (${networkStats})`)
}

function extractContractInfo(filePath, packageName, contractName, network) {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Extract contract ID from networks object
  const contractIdMatch = content.match(/contractId:\s*"([^"]+)"/)
  if (!contractIdMatch) {
    error(`No contract ID found in ${packageName}`)
    return null
  }

  const contractId = contractIdMatch[1]
  
  // Try to get method info from Rust source code (use base contract name without network suffix)
  const rustSourcePath = path.join(__dirname, '..', 'contracts', contractName, 'src', 'lib.rs')
  let rustMethodInfo = {}
  let rustParameterTypes = {}
  
  if (fs.existsSync(rustSourcePath)) {
    try {
      rustMethodInfo = analyzeRustContract(rustSourcePath)
      // Also extract parameter types from Rust source
      rustParameterTypes = extractRustParameterTypes(rustSourcePath)
    } catch (err) {
      // If Rust analysis fails, we'll fall back to heuristics
      console.warn(`\x1b[33mWarning: Could not analyze Rust source for ${packageName}, using heuristics\x1b[0m`)
    }
  }
  
  // Extract methods from Client interface
  const methods = extractMethodsFromClientInterface(content, rustMethodInfo, rustParameterTypes)
  
  // Determine contract properties
  const isStateful = methods.some(m => !m.isReadOnly)
  const hasReadMethods = methods.some(m => m.isReadOnly)
  const hasWriteMethods = methods.some(m => !m.isReadOnly)

  return {
    name: contractName,
    packageName: packageName,
    network: network,
    contractId,
    path: `packages/${packageName}`,
    methods,
    isStateful,
    hasReadMethods,
    hasWriteMethods
  }
}

/**
 * Extract parameter types from Rust function signatures
 */
function extractRustParameterTypes(rustFilePath) {
  const content = fs.readFileSync(rustFilePath, 'utf-8')
  const parameterTypes = {}
  
  // Match pub fn signatures with their parameters
  // Pattern: pub fn function_name(env: Env, param1: Type1, param2: Type2) -> ReturnType
  const functionRegex = /pub\s+fn\s+(\w+)\s*\(([\s\S]*?)\)(?:\s*->\s*([^{]+))?/g
  
  let match
  while ((match = functionRegex.exec(content)) !== null) {
    const [, functionName, paramsString, returnType] = match
    
    // Parse parameters
    const params = {}
    const paramPairs = paramsString.split(',')
    
    paramPairs.forEach(pair => {
      const trimmed = pair.trim()
      if (!trimmed) return
      
      // Match pattern: param_name: Type or _param_name: Type or param_name: soroban_sdk::Type
      const paramMatch = trimmed.match(/(_?\w+)\s*:\s*([\w::<>]+)/)
      if (paramMatch) {
        const [, paramName, paramType] = paramMatch
        // Skip env parameter (including _env)
        if (paramName === 'env' || paramName === '_env') return
        
        // Clean up the type (remove module prefixes)
        let cleanType = paramType.replace(/soroban_sdk::/g, '')
        
        // Map Soroban types to metadata types
        cleanType = mapRustTypeToMetadata(cleanType)
        
        params[paramName] = cleanType
      }
    })
    
    parameterTypes[functionName] = params
  }
  
  return parameterTypes
}

/**
 * Map Rust/Soroban types to metadata types
 */
function mapRustTypeToMetadata(rustType) {
  // Common Soroban type mappings
  const typeMap = {
    'Address': 'Address',
    'BytesN<32>': 'BytesN<32>',
    'String': 'String',
    'Symbol': 'Symbol',
    'u32': 'u32',
    'u64': 'u64',
    'u128': 'u128',
    'i32': 'i32',
    'i64': 'i64',
    'i128': 'i128',
    'bool': 'bool',
    'Vec<BytesN<32>>': 'Vec<BytesN<32>>',
  }
  
  // Return mapped type or original if not in map
  return typeMap[rustType] || rustType
}

/**
 * Analyze all Rust files in the contract to build a complete function database
 * This allows us to detect indirect writes through function calls
 */
function analyzeRustContract(rustFilePath) {
  const contractDir = path.dirname(rustFilePath)
  
  // Step 1: Scan all .rs files in the contract's src directory
  const allRustFiles = findAllRustFiles(contractDir)
  
  // Step 2: Build a database of ALL functions and their behaviors
  const functionDatabase = buildFunctionDatabase(allRustFiles)
  
  // Step 3: Analyze call chains to detect indirect writes
  const methodInfo = analyzeFunctionCallChains(functionDatabase)
  
  return methodInfo
}

/**
 * Find all .rs files in the contract's src directory
 */
function findAllRustFiles(contractDir) {
  const srcDir = contractDir
  const rustFiles = []
  
  if (!fs.existsSync(srcDir)) {
    return rustFiles
  }
  
  // Read all .rs files in src directory
  const files = fs.readdirSync(srcDir)
  files.forEach(file => {
    if (file.endsWith('.rs')) {
      rustFiles.push(path.join(srcDir, file))
    }
  })
  
  return rustFiles
}

/**
 * Build a complete database of all functions across all Rust files
 */
function buildFunctionDatabase(rustFiles) {
  const database = {}
  
  rustFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath, '.rs')
    
    // Extract all function definitions (pub and non-pub)
    // More comprehensive regex to catch all function bodies
    const functionRegex = /(?:pub\s+)?fn\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)(?:\s*->\s*[^{]+)?\s*\{/g
    
    let match
    let lastIndex = 0
    const matches = []
    
    // Collect all function starts
    while ((match = functionRegex.exec(content)) !== null) {
      matches.push({
        name: match[1],
        startIndex: match.index,
        startOfBody: functionRegex.lastIndex
      })
    }
    
    // Extract function bodies by finding matching braces
    matches.forEach((match, idx) => {
      const functionName = match.name
      const startOfBody = match.startOfBody
      
      // Find the end of the function by counting braces
      const endOfBody = findMatchingBrace(content, startOfBody - 1)
      const functionBody = content.substring(startOfBody, endOfBody)
      
      // Analyze what this function does
      const analysis = analyzeFunctionBody(functionBody, fileName)
      
      // Store in database with module prefix if not lib.rs
      const fullName = fileName === 'lib' ? functionName : `${fileName}::${functionName}`
      database[fullName] = {
        name: functionName,
        module: fileName,
        body: functionBody,
        ...analysis
      }
    })
  })
  
  return database
}

/**
 * Find the matching closing brace for a function body
 */
function findMatchingBrace(content, startIndex) {
  let depth = 0
  let inString = false
  let inChar = false
  let escaped = false
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i]
    const prevChar = i > 0 ? content[i - 1] : ''
    
    // Handle string literals
    if (char === '"' && !escaped && !inChar) {
      inString = !inString
    }
    // Handle char literals
    else if (char === "'" && !escaped && !inString) {
      inChar = !inChar
    }
    // Handle escape sequences
    else if (char === '\\') {
      escaped = !escaped
      continue
    }
    
    if (!inString && !inChar) {
      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) {
          return i
        }
      }
    }
    
    escaped = false
  }
  
  return content.length
}

/**
 * Analyze a function body to determine its behavior
 */
function analyzeFunctionBody(body, module) {
  // Check for storage write operations
  // Only consider it a storage write if it's explicitly on env.storage()
  // Pattern: env.storage().instance().set() or env.storage().persistent().set()
  const storageWritePatterns = [
    /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*set\(/,
    /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*extend\(/,
    /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*remove\(/,
    /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*bump\(/,
  ]
  
  const writesStorage = storageWritePatterns.some(pattern => pattern.test(body))
  
  // Authorization requirement (strong indicator of state change)
  const requiresAuth = /\.require_auth\(/.test(body)
  
  // Extract all function calls (both local and module calls)
  const functionCalls = []
  
  // Match module::function calls
  const moduleCallRegex = /(\w+)::(\w+)/g
  let match
  while ((match = moduleCallRegex.exec(body)) !== null) {
    const [, moduleName, functionName] = match
    // Exclude standard library calls
    if (!['soroban_sdk', 'core', 'std', 'alloc', 'Option', 'Result', 'Vec', 'String', 'BytesN'].includes(moduleName)) {
      functionCalls.push(`${moduleName}::${functionName}`)
    }
  }
  
  // Match simple function calls (within same module or local)
  const simpleFunctionCallRegex = /(?:^|[^\w:])(\w+)\s*\(/g
  while ((match = simpleFunctionCallRegex.exec(body)) !== null) {
    const functionName = match[1]
    // Exclude keywords and common macros
    if (!['if', 'for', 'while', 'match', 'return', 'let', 'assert', 'panic', 'expect', 'unwrap', 'Some', 'None', 'Ok', 'Err', 'new', 'clone', 'iter'].includes(functionName)) {
      functionCalls.push(functionName)
    }
  }
  
  return {
    writesStorage,
    requiresAuth,
    functionCalls: [...new Set(functionCalls)] // Remove duplicates
  }
}

/**
 * Analyze call chains to determine if functions write storage (directly or indirectly)
 */
function analyzeFunctionCallChains(database) {
  const methodInfo = {}
  const analyzed = new Map() // Cache to avoid infinite recursion
  
  /**
   * Recursively check if a function writes storage
   */
  function doesFunctionWrite(functionName, visited = new Set()) {
    // Prevent infinite recursion
    if (visited.has(functionName)) {
      return false
    }
    visited.add(functionName)
    
    // Check cache
    if (analyzed.has(functionName)) {
      return analyzed.get(functionName)
    }
    
    const func = database[functionName]
    if (!func) {
      // Function not in our database (might be stdlib or external)
      return false
    }
    
    // Direct write?
    if (func.writesStorage || func.requiresAuth) {
      analyzed.set(functionName, true)
      return true
    }
    
    // Check if any called functions write
    for (const calledFunc of func.functionCalls) {
      // Try both the direct name and with module prefix
      let fullName = calledFunc
      
      // If it doesn't have ::, try to find it in the same module
      if (!calledFunc.includes('::')) {
        // Try same module first
        fullName = `${func.module}::${calledFunc}`
        if (!database[fullName]) {
          // Try just the function name
          fullName = calledFunc
        }
      }
      
      if (doesFunctionWrite(fullName, new Set(visited))) {
        analyzed.set(functionName, true)
        return true
      }
    }
    
    analyzed.set(functionName, false)
    return false
  }
  
  // Analyze only the public functions in lib module (these are the contract methods)
  Object.entries(database).forEach(([fullName, func]) => {
    if (func.module === 'lib') {
      const isWrite = doesFunctionWrite(fullName)
      methodInfo[func.name] = {
        isReadOnly: !isWrite,
        writesStorage: func.writesStorage,
        requiresAuth: func.requiresAuth,
        hasIndirectWrites: isWrite && !func.writesStorage && !func.requiresAuth
      }
    }
  })
  
  return methodInfo
}

function extractMethodsFromClientInterface(content, rustMethodInfo = {}, rustParameterTypes = {}) {
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
          parameters = extractParametersFromSignature(paramMatch[0], methodName, rustParameterTypes)
        }
      }
      
      // Determine if method is read-only
      // Priority: Rust analysis > heuristics
      let isReadOnly
      if (rustMethodInfo[methodName] !== undefined) {
        isReadOnly = rustMethodInfo[methodName].isReadOnly
      } else {
        isReadOnly = determineReadOnlyFromHeuristics(methodName, returnType)
      }
      
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

function extractParametersFromSignature(signature, methodName, rustParameterTypes = {}) {
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
  
  // Parse type definitions from TypeScript
  const typeRegex = /(\w+):\s*([\w<>]+)/g
  const tsTypeMap = {}
  let typeMatch
  
  while ((typeMatch = typeRegex.exec(typeDefinitions)) !== null) {
    const [, paramName, paramType] = typeMatch
    tsTypeMap[paramName] = paramType
  }
  
  // Get Rust parameter types for this method
  const rustParams = rustParameterTypes[methodName] || {}
  
  // Create parameters (exclude 'env' parameter as it's handled internally)
  names.forEach(name => {
    if (name !== 'env' && name !== '_env') {
      // Use Rust type if available, otherwise fall back to TypeScript type
      let paramType = rustParams[name] || tsTypeMap[name] || 'unknown'
      
      // If TypeScript type is 'string' and we don't have Rust info, check if it's likely an Address
      if (paramType === 'string' && !rustParams[name]) {
        // Common naming patterns for addresses
        if (/^(admin|owner|lessor|lessee|from|to|sender|recipient|payer|payee|account|user|address|authority|signer|creator|minter|burner|spender|operator)$/.test(name)) {
          paramType = 'Address'
        }
      }
      
      // Map TypeScript Buffer to proper Soroban type
      if (paramType === 'Buffer') {
        paramType = rustParams[name] || 'BytesN<32>'
      }
      
      parameters.push({
        name,
        type: paramType
      })
    }
  })

  return parameters
}

/**
 * Fallback heuristics when Rust source analysis is not available
 * This is less accurate than analyzing the actual Rust code
 */
function determineReadOnlyFromHeuristics(methodName, returnType) {
  // Methods that return null/void are typically write operations
  if (returnType === 'null' || returnType === 'void') {
    return false
  }
  
  // Methods returning boolean are often write operations (success/failure indicators)
  // But not always, so we check the name too
  if (returnType === 'boolean' || returnType === 'bool') {
    // If name suggests a query, it's read-only
    if (/^(is_|has_|can_|should_|check_|verify_|validate_)/i.test(methodName)) {
      return true
    }
    // Otherwise, boolean returns often indicate write operations
    // (e.g., process_payment returns bool, terminate_lease returns bool)
    return false
  }
  
  // Strong indicators of write operations (state-modifying verbs)
  const writePatterns = [
    // Creation and initialization
    /^(create|initialize|init|setup|register|deploy)/i,
    // Modification
    /^(set|add|remove|delete|update|modify|change|edit|save|store|put)/i,
    /^(increment|decrement|reset|clear|extend|reduce|increase|decrease)/i,
    // Financial/token operations
    /^(mint|burn|transfer|send|approve|deposit|withdraw|pay|process)/i,
    // State changes
    /^(lock|unlock|enable|disable|activate|deactivate|pause|unpause|freeze|unfreeze)/i,
    // Permissions and governance
    /^(grant|revoke|claim|stake|unstake|vote|execute|propose)/i,
    // Lifecycle operations
    /^(start|stop|begin|end|finish|complete|terminate|cancel|close|open)/i,
    // Dispute and resolution
    /^(raise|resolve|dispute|appeal|challenge)/i,
    // Recording and logging
    /^(record|log|track|submit|report)/i,
  ]
  
  // Check if method name matches any write pattern
  const isWriteMethod = writePatterns.some(pattern => pattern.test(methodName))
  if (isWriteMethod) {
    return false
  }
  
  // Strong indicators of read operations (getters, queries)
  const readPatterns = [
    // Explicit getters
    /^(get_|fetch_|read_|load_|retrieve_|find_)/i,
    // Queries and checks
    /^(query_|check_|verify_|validate_|search_|lookup_)/i,
    // Boolean queries
    /^(is_|has_|can_|should_|does_|will_)/i,
    // Common read-only property names
    /^(balance$|name$|symbol$|decimals$|owner$|admin$)/i,
    /^(total_|count$|size$|length$|version$|status$|state$)/i,
    // Information and details
    /_(details|info|data|history|list|records)$/i,
  ]
  
  // Check if method name matches any read pattern
  const isReadMethod = readPatterns.some(pattern => pattern.test(methodName))
  if (isReadMethod) {
    return true
  }
  
  // Default: Be conservative
  // If we can't determine from the name and it returns a value, assume it might write
  // This is safer than assuming read-only and potentially missing auth requirements
  // Exception: if it returns a complex type (not bool/null), more likely read-only
  const returnsComplexType = returnType && 
    !['boolean', 'bool', 'null', 'void', 'u32', 'u64', 'i32', 'i64', 'i128', 'u128'].includes(returnType)
  
  return returnsComplexType
}

// Run the generator
if (require.main === module) {
  generateContractMetadata()
}

module.exports = { generateContractMetadata }
