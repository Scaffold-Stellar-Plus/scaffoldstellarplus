#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message) => console.log(`\n\x1b[1;32m[SETUP] ${message}\x1b[0m`);
const error = (message) => console.error(`\x1b[1;31m[ERROR] ${message}\x1b[0m`);
const info = (message) => console.log(`\x1b[1;36m[INFO] ${message}\x1b[0m`);
const success = (message) => console.log(`\x1b[1;32m✅ ${message}\x1b[0m`);
const warn = (message) => console.log(`\x1b[1;33m⚠️  ${message}\x1b[0m`);

function checkCommand(command, name, installInstructions) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    success(`${name} is installed`);
    return true;
  } catch (err) {
    warn(`${name} is not installed`);
    if (installInstructions) {
      console.log(`   Install: ${installInstructions}`);
    }
    return false;
  }
}

function createEnvFile() {
  const envPath = path.join(__dirname, '..', 'frontend', '.env.local');
  
  if (fs.existsSync(envPath)) {
    info('.env.local already exists');
    return;
  }

  const envContent = `# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org:443
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Contract IDs (auto-populated after deployment)
# NEXT_PUBLIC_HELLO_WORLD_CONTRACT_ID=
# NEXT_PUBLIC_INCREMENT_CONTRACT_ID=
# NEXT_PUBLIC_TOKEN_CONTRACT_ID=
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  success('Created frontend/.env.local');
}

function setupStellarAccount() {
  try {
    // Check if alice account already exists
    const existingKeys = execSync('stellar keys ls', { encoding: 'utf8', stdio: 'pipe' });
    
    if (existingKeys.includes('alice')) {
      info('Stellar account "alice" already exists');
      return;
    }

    // Generate new alice account
    execSync('stellar keys generate alice --network testnet', { stdio: 'pipe' });
    
    // Fund the account using friendbot
    try {
      const address = execSync('stellar keys address alice', { encoding: 'utf8', stdio: 'pipe' }).trim();
      execSync(`curl -s "https://friendbot.stellar.org?addr=${address}" > /dev/null 2>&1`, { stdio: 'pipe' });
      success('Created and funded Stellar account "alice"');
    } catch (fundErr) {
      success('Created Stellar account "alice" (funding may have failed, but account is ready)');
    }
  } catch (err) {
    error('Failed to setup Stellar account');
    console.error('\x1b[90mError: ' + err.message + '\x1b[0m');
    console.log('\n💡 You can manually create the account with:');
    console.log('   stellar keys generate alice --network testnet');
    console.log('   curl "https://friendbot.stellar.org?addr=$(stellar keys address alice)"\n');
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║            ScaffoldStellar Setup & Configuration               ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  log('Checking prerequisites...');

  const checks = {
    node: checkCommand('node', 'Node.js', 'https://nodejs.org/'),
    yarn: checkCommand('yarn', 'Yarn', 'npm install -g yarn'),
    rustc: checkCommand('rustc', 'Rust', 'https://rustup.rs/'),
    cargo: checkCommand('cargo', 'Cargo', 'https://rustup.rs/'),
    stellar: checkCommand('stellar', 'Stellar CLI', 'https://developers.stellar.org/docs/tools/developer-tools'),
  };

  const allInstalled = Object.values(checks).every(Boolean);

  if (!allInstalled) {
    error('Some prerequisites are missing!');
    console.log('\n📚 Installation guides:');
    console.log('   Node.js: https://nodejs.org/');
    console.log('   Yarn: npm install -g yarn');
    console.log('   Rust: https://rustup.rs/');
    console.log('   Stellar CLI: https://developers.stellar.org/docs/tools/developer-tools\n');
    process.exit(1);
  }

  log('All prerequisites are installed! 🎉\n');

  // Check Rust target
  log('Checking Rust wasm32v1-none target...');
  try {
    const targets = execSync('rustup target list --installed', { encoding: 'utf8' });
    if (targets.includes('wasm32v1-none')) {
      success('wasm32v1-none target is installed');
    } else {
      warn('wasm32v1-none target not found, installing...');
      execSync('rustup target add wasm32v1-none', { stdio: 'inherit' });
      success('Installed wasm32v1-none target');
    }
  } catch (err) {
    error('Failed to check/install wasm32v1-none target');
    
    // Log detailed error information
    if (err.stderr) {
      console.error('\x1b[90mStderr:\x1b[0m')
      console.error('\x1b[90m' + err.stderr.toString() + '\x1b[0m')
    }
    if (err.message) {
      console.error('\x1b[90m' + err.message + '\x1b[0m')
    }
  }

  // Install dependencies
  log('Installing Node.js dependencies...');
  try {
    execSync('yarn install', { stdio: 'inherit' });
    success('Dependencies installed');
  } catch (err) {
    error('Failed to install dependencies');
    
    // Log detailed error information
    if (err.stderr) {
      console.error('\x1b[90mStderr:\x1b[0m')
      console.error('\x1b[90m' + err.stderr.toString() + '\x1b[0m')
    }
    if (err.message) {
      console.error('\x1b[90m' + err.message + '\x1b[0m')
    }
    
    process.exit(1);
  }

  // Create .env file
  log('Setting up environment configuration...');
  createEnvFile();

  // Setup Stellar account (alice)
  log('Setting up Stellar account...');
  setupStellarAccount();

  // Check for contracts
  log('Checking contracts...');
  const contractsDir = path.join(__dirname, '..', 'contracts');
  const hasContracts = fs.existsSync(contractsDir) && 
                       fs.readdirSync(contractsDir).some(f => 
                         fs.statSync(path.join(contractsDir, f)).isDirectory() && 
                         fs.existsSync(path.join(contractsDir, f, 'Cargo.toml'))
                       );

  if (hasContracts) {
    success('Contracts found');
  } else {
    warn('No contracts found in ./contracts/');
  }

  // Success message
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║                   🎉  Setup Complete! 🎉                       ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Next steps:\n');
  console.log('   1. Deploy contracts:');
  console.log('      \x1b[1;36myarn deploy:testnet\x1b[0m\n');
  console.log('   2. Start development server:');
  console.log('      \x1b[1;36myarn dev\x1b[0m\n');
  console.log('   3. Open your browser:');
  console.log('      \x1b[1;36mhttp://localhost:3000\x1b[0m\n');

  console.log('📚 Documentation:');
  console.log('   • Quick Start: ZERO_CONFIG_QUICK_START.md');
  console.log('   • Implementation: ZERO_CONFIG_IMPLEMENTATION.md');
  console.log('   • README: README.md\n');

  console.log('💡 Helpful commands:');
  console.log('   yarn deploy:testnet  - Deploy to Stellar testnet');
  console.log('   yarn deploy:localnet - Deploy to local network');
  console.log('   yarn dev             - Start frontend dev server');
  console.log('   yarn clean           - Clean auto-generated files\n');
}

main().catch((err) => {
  error('Setup failed!');
  console.error(err);
  process.exit(1);
});
