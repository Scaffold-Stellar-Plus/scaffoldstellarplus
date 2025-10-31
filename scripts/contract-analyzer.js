#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Contract Constructor Analyzer
 * 
 * Analyzes Rust contract source files to detect constructor arguments
 * and provides interactive prompts for collecting constructor parameters
 */

const log = (message) => console.log(`\x1b[36m${message}\x1b[0m`)
const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)
const info = (message) => console.log(`\x1b[33m📋 ${message}\x1b[0m`)
const warning = (message) => console.log(`\x1b[33m⚠️  ${message}\x1b[0m`)

/**
 * Parse constructor arguments from Rust source code
 * Handles both single-line and multi-line constructor definitions
 */
const parseConstructorArgs = (sourceCode) => {
  // Find the __constructor function start
  const constructorMatch = sourceCode.match(/pub\s+fn\s+__constructor\s*\(/i)
  
  if (!constructorMatch) {
    return null
  }
  
  // Find the opening parenthesis position
  const openParenPos = constructorMatch.index + constructorMatch[0].lastIndexOf('(')
  
  // Find the matching closing parenthesis using bracket matching
  // We need to find the ')' that closes the parameter list before the '{'
  let parenCount = 0
  let closingParenPos = -1
  let openingBracePos = sourceCode.indexOf('{', openParenPos)
  
  // Start from the opening parenthesis and search until we find the matching ')'
  for (let i = openParenPos; i < openingBracePos && i < sourceCode.length; i++) {
    if (sourceCode[i] === '(') {
      parenCount++
    } else if (sourceCode[i] === ')') {
      parenCount--
      if (parenCount === 0) {
        closingParenPos = i
        break
      }
    }
  }
  
  if (closingParenPos === -1) {
    return null
  }
  
  // Extract the parameter string between parentheses (excluding the parentheses themselves)
  const paramsString = sourceCode.substring(openParenPos + 1, closingParenPos).trim()
  
  if (!paramsString) {
    return []
  }
  
  // Parse individual parameters
  const args = []
  
  // We'll use a simple approach: split by comma and handle multi-line parameters
  const paramParts = []
  let currentParam = ''
  let angleBracketDepth = 0
  
  for (let i = 0; i < paramsString.length; i++) {
    const char = paramsString[i]
    
    if (char === '<') {
      angleBracketDepth++
      currentParam += char
    } else if (char === '>') {
      angleBracketDepth--
      currentParam += char
    } else if (char === ',' && angleBracketDepth === 0) {
      // This comma is at the top level, so it separates parameters
      if (currentParam.trim()) {
        paramParts.push(currentParam.trim())
      }
      currentParam = ''
    } else {
      currentParam += char
    }
  }
  
  // Add the last parameter
  if (currentParam.trim()) {
    paramParts.push(currentParam.trim())
  }
  
  // Process each parameter
  for (const param of paramParts) {
    // Skip 'e: Env' parameter (environment)
    if (param.includes('e: Env') || param.includes('env: Env')) {
      continue
    }
    
    // Extract parameter name and type
    // Format: name: Type or name: Type, with possible whitespace
    const paramMatch = param.match(/(\w+):\s*(.+)/)
    if (paramMatch) {
      const [, name, type] = paramMatch
      args.push({
        name: name.trim(),
        type: type.trim()
      })
    }
  }
  
  return args
}

/**
 * Get type description for user-friendly prompts
 */
const getTypeDescription = (type) => {
  const typeMap = {
    'Address': 'Stellar address (starts with C or G)',
    'String': 'Text string',
    'Symbol': 'Symbol (short text identifier)',
    'i128': 'Integer number',
    'u32': 'Positive integer',
    'u64': 'Large positive integer',
    'bool': 'Boolean (true/false)',
    'Vec<Address>': 'List of Stellar addresses',
    'Vec<String>': 'List of text strings'
  }
  
  // Handle generic types
  if (type.includes('Vec<')) {
    const innerType = type.match(/Vec<([^>]+)>/)?.[1]
    if (innerType) {
      return `List of ${getTypeDescription(innerType).toLowerCase()}`
    }
  }
  
  return typeMap[type] || type
}

/**
 * Validate user input based on type
 */
const validateInput = (value, type) => {
  if (!value || value.trim() === '') {
    return 'Value cannot be empty'
  }
  
  const trimmedValue = value.trim()
  
  switch (type) {
    case 'Address':
      // Basic Stellar address validation
      if (!trimmedValue.match(/^[CG][A-Z0-9]{55}$/)) {
        return 'Invalid Stellar address format (should start with C or G and be 56 characters)'
      }
      break
      
    case 'String':
    case 'Symbol':
      // Basic string validation
      if (trimmedValue.length === 0) {
        return 'String cannot be empty'
      }
      break
      
    case 'i128':
    case 'u32':
    case 'u64':
      if (!/^-?\d+$/.test(trimmedValue)) {
        return 'Must be a valid integer'
      }
      break
      
    case 'bool':
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(trimmedValue.toLowerCase())) {
        return 'Must be true/false, 1/0, or yes/no'
      }
      break
  }
  
  return null
}

/**
 * Convert user input to appropriate format for CLI
 */
const formatForCLI = (value, type) => {
  const trimmedValue = value.trim()
  
  switch (type) {
    case 'bool':
      const boolValue = ['true', '1', 'yes'].includes(trimmedValue.toLowerCase())
      return boolValue ? 'true' : 'false'
      
    case 'String':
    case 'Symbol':
      // Quote strings that contain spaces or special characters
      if (trimmedValue.includes(' ') || trimmedValue.includes('-')) {
        return `"${trimmedValue}"`
      }
      return trimmedValue
      
    default:
      return trimmedValue
  }
}

/**
 * Analyze contract for constructor arguments
 * Searches all .rs files in the src/ directory to handle modular code structures
 */
const analyzeContract = (contractPath) => {
  const srcPath = path.join(contractPath, 'src')
  
  if (!fs.existsSync(srcPath)) {
    return null
  }
  
  // Get all .rs files in the src directory
  const files = fs.readdirSync(srcPath).filter(file => file.endsWith('.rs'))
  
  if (files.length === 0) {
    return null
  }
  
  // Sort files to check lib.rs first (common location), then others
  files.sort((a, b) => {
    if (a === 'lib.rs') return -1
    if (b === 'lib.rs') return 1
    return a.localeCompare(b)
  })
  
  // Search through all .rs files to find the constructor
  for (const file of files) {
    const filePath = path.join(srcPath, file)
    
    try {
      const sourceCode = fs.readFileSync(filePath, 'utf8')
      const constructorArgs = parseConstructorArgs(sourceCode)
      
      // If constructor found in this file, return it
      if (constructorArgs !== null) {
        return {
          hasConstructor: true,
          args: constructorArgs,
          foundIn: file
        }
      }
    } catch (err) {
      // Continue to next file if this one fails
      warning(`Failed to read ${filePath}: ${err.message}`)
      continue
    }
  }
  
  // No constructor found in any file
  return {
    hasConstructor: false,
    args: []
  }
}

/**
 * Interactive constructor argument collection
 */
const collectConstructorArgs = async (contractName, constructorArgs) => {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }
  
  console.log(`\n\x1b[1;33m🔧 Constructor Arguments for ${contractName}\x1b[0m`)
  console.log('\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m')
  
  if (constructorArgs.length === 0) {
    console.log('\x1b[32m✅ No constructor arguments required\x1b[0m')
    rl.close()
    return ''
  }
  
  console.log(`\x1b[33mThis contract requires ${constructorArgs.length} constructor argument(s):\x1b[0m\n`)
  
  const collectedArgs = []
  
  for (let i = 0; i < constructorArgs.length; i++) {
    const arg = constructorArgs[i]
    const typeDesc = getTypeDescription(arg.type)
    
    console.log(`\x1b[1m${i + 1}. ${arg.name}\x1b[0m (${typeDesc})`)
    
    let value = ''
    let isValid = false
    
    while (!isValid) {
      value = await question(`   Enter value for ${arg.name}: `)
      const validationError = validateInput(value, arg.type)
      
      if (validationError) {
        error(`   ${validationError}`)
        console.log('   Please try again.\n')
      } else {
        isValid = true
      }
    }
    
    const formattedValue = formatForCLI(value, arg.type)
    collectedArgs.push(`--${arg.name} ${formattedValue}`)
    console.log(`   \x1b[32m✓ Set to: ${formattedValue}\x1b[0m\n`)
  }
  
  rl.close()
  
  const argsString = collectedArgs.join(' ')
  console.log(`\x1b[1;32m✅ Constructor arguments collected: ${argsString}\x1b[0m\n`)
  
  return argsString
}

/**
 * Main analysis function
 */
const analyzeContractConstructor = (contractPath) => {
  const analysis = analyzeContract(contractPath)
  
  if (!analysis) {
    return null
  }
  
  return {
    contractName: path.basename(contractPath),
    hasConstructor: analysis.hasConstructor,
    args: analysis.args,
    argsCount: analysis.args.length
  }
}

module.exports = {
  analyzeContractConstructor,
  collectConstructorArgs,
  parseConstructorArgs,
  getTypeDescription,
  validateInput,
  formatForCLI
}

// CLI usage
if (require.main === module) {
  const contractPath = process.argv[2]
  
  if (!contractPath) {
    console.log('Usage: node contract-analyzer.js <contract-path>')
    process.exit(1)
  }
  
  const analysis = analyzeContractConstructor(contractPath)
  
  if (!analysis) {
    error('Failed to analyze contract')
    process.exit(1)
  }
  
  console.log(`\nContract: ${analysis.contractName}`)
  console.log(`Has constructor: ${analysis.hasConstructor}`)
  console.log(`Arguments: ${analysis.argsCount}`)
  
  if (analysis.args.length > 0) {
    console.log('\nConstructor arguments:')
    analysis.args.forEach((arg, i) => {
      console.log(`  ${i + 1}. ${arg.name} (${arg.type})`)
    })
  }
}
