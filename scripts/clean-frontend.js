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
const CONTRACT_METADATA = path.join(FRONTEND_DIR, 'lib/contract-metadata.json');

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
 */
function cleanContractImports() {
  console.log('\n🧹 Cleaning auto-generated contract imports...');
  
  if (!fs.existsSync(CONTRACTS_DIR)) {
    console.log('   No contracts directory found');
    return 0;
  }

  const files = fs.readdirSync(CONTRACTS_DIR);
  let count = 0;

  files.forEach(file => {
    // Skip util.ts - it's not auto-generated
    if (file === 'util.ts') {
      console.log(`   ℹ️  Preserved: util.ts (not auto-generated)`);
      return;
    }

    // Remove all other .ts files (they are auto-generated)
    if (file.endsWith('.ts')) {
      const filePath = path.join(CONTRACTS_DIR, file);
      if (safeRemove(filePath, `contracts/${file}`)) {
        count++;
      }
    }
  });

  console.log(`   📊 Removed ${count} auto-generated contract import(s)`);
  return count;
}

/**
 * Clean all packages (entire packages directory)
 * Since packages are auto-generated during deployment, we remove everything
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

  // Remove all package directories since they are auto-generated
  packages.forEach(pkg => {
    const pkgPath = path.join(PACKAGES_DIR, pkg);
    if (safeRemove(pkgPath, `packages/${pkg}`)) {
      removedCount++;
    }
  });

  if (removedCount > 0) {
    console.log(`   📊 Removed ${removedCount} auto-generated package(s)`);
  } else {
    console.log('   No packages to remove');
  }
  
  return removedCount;
}

/**
 * Clean contract metadata
 */
function cleanContractMetadata() {
  console.log('\n🧹 Cleaning contract metadata...');
  
  if (safeRemove(CONTRACT_METADATA, 'lib/contract-metadata.json')) {
    console.log('   📊 Removed contract metadata file');
    return 1;
  }
  
  console.log('   No metadata file found');
  return 0;
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
  console.log('🚀 Starting frontend cleanup...');
  console.log('═'.repeat(50));

  let totalRemoved = 0;
  
  totalRemoved += cleanContractImports();
  totalRemoved += cleanPackageBuildArtifacts();
  totalRemoved += cleanContractMetadata();
  totalRemoved += cleanNextJsArtifacts();

  console.log('\n' + '═'.repeat(50));
  console.log(`✨ Cleanup complete! Removed ${totalRemoved} item(s)`);
  console.log('\n💡 To regenerate all auto-generated files, run:');
  console.log('   yarn deploy:testnet');
  console.log('   (or yarn build:packages && yarn post-deploy if already deployed)\n');
}

// Run the cleanup
try {
  cleanFrontend();
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}

