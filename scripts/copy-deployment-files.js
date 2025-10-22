#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Copy deployment files to public directory so they can be accessed by the frontend
 * This enables network switching in the frontend by loading deployment data for different networks
 */

const log = (message) => console.log(`\x1b[36m${message}\x1b[0m`)
const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)

const copyDeploymentFile = (sourceFile, destFile) => {
  try {
    if (fs.existsSync(sourceFile)) {
      // Ensure frontend/public directory exists
      const publicDir = path.join('frontend', 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      fs.copyFileSync(sourceFile, destFile)
      success(`Copied ${sourceFile} to ${destFile}`)
      return true
    } else {
      log(`${sourceFile} not found, skipping...`)
      return false
    }
  } catch (err) {
    error(`Failed to copy ${sourceFile}: ${err.message}`)
    return false
  }
}

const main = () => {
  console.log('\n📦 Copying deployment files to frontend public directory...\n')

  let copiedCount = 0

  // Copy testnet deployment (deployment.json)
  if (copyDeploymentFile('deployment.json', 'frontend/public/deployment.json')) {
    copiedCount++
  }

  // Copy mainnet deployment (deployment-mainnet.json)
  if (copyDeploymentFile('deployment-mainnet.json', 'frontend/public/deployment-mainnet.json')) {
    copiedCount++
  }

  // Copy futurenet deployment (deployment-futurenet.json) if it exists
  if (copyDeploymentFile('deployment-futurenet.json', 'frontend/public/deployment-futurenet.json')) {
    copiedCount++
  }

  console.log(`\n✨ Copied ${copiedCount} deployment file(s)\n`)

  if (copiedCount === 0) {
    error('No deployment files found. Please deploy contracts first.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { copyDeploymentFile }

