#!/usr/bin/env node

/**
 * Cleans all auto-generated files from the frontend directory
 * Preserves: util.ts, core library files, and source packages
 */

const fs = require('fs');
const path = require('path');

// Paths
const FRONTEND_DIR = path.join(__dirname, '../frontend');
const CONTRACTS_DIR = path.join(FRONTEND_DIR, 'contracts');
const PACKAGES_DIR = path.join(FRONTEND_DIR, 'packages');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const LIB_DIR = path.join(FRONTEND_DIR, 'lib');
const CONTRACT_METADATA = path.join(LIB_DIR, 'contract-metadata.json');
const CONTRACT_MAP = path.join(LIB_DIR, 'contract-map.ts');

/**
 * Safely remove a file or directory
 */
function safeRemove(targetPath, description) {
  try {
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
      console.log(`✅ Removed: ${description}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error removing ${description}:`, error.message);
    return false;
  }
}

/**
 * Clean auto-generated contract import files (except util.ts)
 * Includes network-specific imports like hello_world-testnet.ts, hello_world-mainnet.ts
 */
function cleanContractImports() {
  console.log('\n🧹 Cleaning auto-generated contract imports...');
  
  if (!fs.existsSync(CONTRACTS_DIR)) {
    console.log('   No contracts directory found');
    return 0;
  }

  const files = fs.readdirSync(CONTRACTS_DIR);
  let count = 0;
  let networkSpecificCount = 0;

  files.forEach(file => {
    // Skip util.ts - it's not auto-generated
    if (file === 'util.ts') {
      console.log(`   ℹ️  Preserved: util.ts (not auto-generated)`);
      return;
    }

    // Remove all other .ts files (they are auto-generated)
    if (file.endsWith('.ts')) {
      const filePath = path.join(CONTRACTS_DIR, file);
      
      // Track network-specific files
      if (file.includes('-testnet.ts') || file.includes('-mainnet.ts') || file.includes('-futurenet.ts') || file.includes('-unknown.ts')) {
        networkSpecificCount++;
      }
      
      if (safeRemove(filePath, `contracts/${file}`)) {
        count++;
      }
    }
  });

  console.log(`   📊 Removed ${count} auto-generated contract import(s) (${networkSpecificCount} network-specific)`);
  return count;
}

/**
 * Clean all packages (entire packages directory)
 * Includes network-specific packages like hello_world-testnet, hello_world-mainnet
 */
function cleanPackageBuildArtifacts() {
  console.log('\n🧹 Cleaning auto-generated packages...');
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    console.log('   No packages directory found');
    return 0;
  }

  const packages = fs.readdirSync(PACKAGES_DIR).filter(item => {
    const itemPath = path.join(PACKAGES_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  let removedCount = 0;
  let testnetCount = 0;
  let mainnetCount = 0;
  let futurenetCount = 0;

  // Remove all package directories since they are auto-generated
  packages.forEach(pkg => {
    const pkgPath = path.join(PACKAGES_DIR, pkg);
    
    // Track network-specific packages
    if (pkg.endsWith('-testnet')) testnetCount++;
    else if (pkg.endsWith('-mainnet')) mainnetCount++;
    else if (pkg.endsWith('-futurenet')) futurenetCount++;
    
    if (safeRemove(pkgPath, `packages/${pkg}`)) {
      removedCount++;
    }
  });

  if (removedCount > 0) {
    console.log(`   📊 Removed ${removedCount} auto-generated package(s)`);
    if (testnetCount > 0) console.log(`      - Testnet: ${testnetCount}`);
    if (mainnetCount > 0) console.log(`      - Mainnet: ${mainnetCount}`);
    if (futurenetCount > 0) console.log(`      - Futurenet: ${futurenetCount}`);
  } else {
    console.log('   No packages to remove');
  }
  
  return removedCount;
}

/**
 * Clean contract metadata and auto-generated lib files
 * Includes contract-metadata.json and contract-map.ts (both network-aware)
 */
function cleanContractMetadata() {
  console.log('\n🧹 Cleaning contract metadata and auto-generated lib files...');
  
  let count = 0;
  
  if (safeRemove(CONTRACT_METADATA, 'lib/contract-metadata.json')) {
    count++;
  }
  
  if (safeRemove(CONTRACT_MAP, 'lib/contract-map.ts')) {
    count++;
  }
  
  if (count > 0) {
    console.log(`   📊 Removed ${count} auto-generated lib file(s)`);
  } else {
    console.log('   No metadata files found');
  }
  
  return count;
}

/**
 * Clean deployment files from public directory
 * Removes network-specific deployment files
 */
function cleanDeploymentFiles() {
  console.log('\n🧹 Cleaning deployment files from public directory...');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log('   No public directory found');
    return 0;
  }
  
  const deploymentFiles = [
    'deployment.json',           // testnet
    'deployment-mainnet.json',   // mainnet
    'deployment-futurenet.json', // futurenet
  ];
  
  let count = 0;
  deploymentFiles.forEach(file => {
    const filePath = path.join(PUBLIC_DIR, file);
    if (safeRemove(filePath, `public/${file}`)) {
      count++;
    }
  });
  
  if (count > 0) {
    console.log(`   📊 Removed ${count} deployment file(s)`);
  } else {
    console.log('   No deployment files found');
  }
  
  return count;
}

/**
 * Clean Next.js build artifacts
 */
function cleanNextJsArtifacts() {
  console.log('\n🧹 Cleaning Next.js build artifacts...');
  
  const artifacts = [
    { path: path.join(FRONTEND_DIR, '.next'), name: '.next' },
    { path: path.join(FRONTEND_DIR, 'out'), name: 'out' },
    { path: path.join(FRONTEND_DIR, 'tsconfig.tsbuildinfo'), name: 'tsconfig.tsbuildinfo' }
  ];

  let count = 0;
  artifacts.forEach(artifact => {
    if (safeRemove(artifact.path, artifact.name)) {
      count++;
    }
  });

  console.log(`   📊 Removed ${count} Next.js artifact(s)`);
  return count;
}

/**
 * Main clean function
 */
function cleanFrontend() {
  console.log('🚀 Starting deep frontend cleanup...');
  console.log('🌐 Cleaning all network-specific files (testnet, mainnet, futurenet)');
  console.log('═'.repeat(60));

  let totalRemoved = 0;
  
  totalRemoved += cleanContractImports();
  totalRemoved += cleanPackageBuildArtifacts();
  totalRemoved += cleanContractMetadata();
  totalRemoved += cleanDeploymentFiles();
  totalRemoved += cleanNextJsArtifacts();

  console.log('\n' + '═'.repeat(60));
  console.log(`✨ Deep cleanup complete! Removed ${totalRemoved} item(s)`);
  console.log('\n💡 To regenerate all auto-generated files:');
  console.log('   For testnet:  yarn deploy:testnet');
  console.log('   For mainnet:  yarn deploy:mainnet');
  console.log('   Or if already deployed: yarn build:packages && yarn post-deploy\n');
}

// Run the cleanup
try {
  cleanFrontend();
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  
  // Log detailed error information
  if (error.stack) {
    console.error('\x1b[90m' + error.stack + '\x1b[0m');
  }
  
  process.exit(1);
}

