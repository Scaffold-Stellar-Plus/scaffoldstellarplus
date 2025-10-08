#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Clean logging with spinners
const success = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`)
const error = (message) => console.error(`\x1b[31m❌ ${message}\x1b[0m`)
const info = (message) => console.log(`\x1b[36m${message}\x1b[0m`)

// Progress spinner with elapsed time and minimum display time
let spinnerInterval
let spinnerSeconds = 0
let spinnerStartTime
const MINIMUM_SPINNER_DISPLAY_MS = 1000 // Ensure spinner shows for at least 1 second

const startSpinner = (text) => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  spinnerSeconds = 0
  spinnerStartTime = Date.now()
  process.stdout.write('\x1b[?25l') // Hide cursor
  
  // Immediately display first frame
  process.stdout.write(`\r\x1b[36m${frames[0]} ${text}\x1b[0m`)
  
  // Then animate through remaining frames
  spinnerInterval = setInterval(() => {
    i = (i + 1) % frames.length
    const timeMsg = spinnerSeconds > 3 ? ` (${spinnerSeconds}s)` : ''
    process.stdout.write(`\r\x1b[36m${frames[i]} ${text}${timeMsg}\x1b[0m`)
    
    // Update seconds counter every 10 frames (roughly 800ms)
    if (i === 0) spinnerSeconds++
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
  if (successText) {
    const timeMsg = spinnerSeconds > 3 ? ` (${spinnerSeconds}s)` : ''
    success(`${successText}${timeMsg}`)
  }
}

/**
 * Script to build all contract packages
 * This ensures each contract package is built with npm run build
 * which is crucial for the dist folder to be available
 */

async function buildContractPackages() {
  const packagesDir = path.join(__dirname, '..', 'frontend', 'packages')
  
  if (!fs.existsSync(packagesDir)) {
    error('Packages directory not found')
    process.exit(1)
  }

  // Get all package directories
  const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  if (packages.length === 0) {
    error('No contract packages found')
    process.exit(1)
  }

  info(`Building ${packages.length} packages...`)

  let successCount = 0
  let failureCount = 0
  const failed = []

  for (const packageName of packages) {
    const packagePath = path.join(packagesDir, packageName)
    
    try {
      // Check if package.json exists
      const packageJsonPath = path.join(packagePath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        continue
      }

      startSpinner(`Building ${packageName}...`)

      // Install dependencies silently
      try {
        execSync('npm install', { 
          cwd: packagePath, 
          stdio: 'pipe',
          timeout: 60000
        })
      } catch (installErr) {
        // Silently continue - dependencies might already be installed
      }

      // Build the package
      execSync('npm run build', { 
        cwd: packagePath, 
        stdio: 'pipe',
        timeout: 60000
      })

      // Verify dist folder was created
      const distPath = path.join(packagePath, 'dist')
      if (!fs.existsSync(distPath)) {
        throw new Error('Dist folder not created')
      }

      await stopSpinner(`${packageName} built`)
      successCount++

    } catch (buildErr) {
      await stopSpinner()
      error(`Failed to build ${packageName}`)
      failureCount++
      failed.push(packageName)
    }
  }

  // Summary
  console.log()
  if (successCount > 0) {
    success(`Built ${successCount}/${packages.length} packages`)
  }
  
  if (failureCount > 0) {
    if (successCount === 0) {
      error('All package builds failed')
      process.exit(1)
    } else {
      console.log(`\x1b[33m⚠️  Failed: ${failed.join(', ')}\x1b[0m`)
    }
  }
}

// Run the builder
if (require.main === module) {
  buildContractPackages()
}

module.exports = { buildContractPackages }
