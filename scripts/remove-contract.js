#!/usr/bin/env node

/**
 * Script to remove a Soroban smart contract
 * Safely removes contract files and updates workspace configuration
 * 
 * Usage: yarn removecontract <contract_name>
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Get contract name from command line args
const contractName = process.argv[2];

if (!contractName) {
  console.error('❌ Error: Contract name is required');
  console.log('Usage: yarn removecontract <contract_name>');
  process.exit(1);
}

// Validate contract name (alphanumeric and underscores only)
if (!/^[a-z][a-z0-9_]*$/.test(contractName)) {
  console.error('❌ Error: Invalid contract name format');
  console.log('Contract name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores');
  process.exit(1);
}

const contractsDir = path.join(__dirname, '..', 'contracts');
const contractDir = path.join(contractsDir, contractName);

// Check if contract exists
if (!fs.existsSync(contractDir)) {
  console.error(`❌ Error: Contract '${contractName}' does not exist`);
  console.log(`\nAvailable contracts:`);
  
  // List available contracts
  const contracts = fs.readdirSync(contractsDir)
    .filter(item => {
      const itemPath = path.join(contractsDir, item);
      return fs.statSync(itemPath).isDirectory() && 
             fs.existsSync(path.join(itemPath, 'Cargo.toml'));
    });
  
  if (contracts.length === 0) {
    console.log('  (no contracts found)');
  } else {
    contracts.forEach(c => console.log(`  - ${c}`));
  }
  
  process.exit(1);
}

// Function to prompt user for confirmation
function askConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`\n⚠️  Are you sure you want to remove contract '${contractName}'? This cannot be undone. (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main removal function
async function removeContract() {
  console.log(`🗑️  Removing contract: ${contractName}\n`);

  // Check if --force flag is provided
  const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');

  // Ask for confirmation unless --force is used
  if (!forceFlag) {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      console.log('\n❌ Removal cancelled');
      process.exit(0);
    }
  }

  console.log('\n🔧 Removing contract files...');

  // Remove contract directory
  try {
    fs.rmSync(contractDir, { recursive: true, force: true });
    console.log(`✅ Removed contracts/${contractName}/`);
  } catch (error) {
    console.error(`❌ Error removing contract directory: ${error.message}`);
    
    // Log detailed error information
    if (error.stack) {
      console.error('\x1b[90m' + error.stack + '\x1b[0m');
    }
    
    process.exit(1);
  }

  // Update workspace Cargo.toml
  console.log('📝 Updating workspace Cargo.toml...');
  const workspaceCargoPath = path.join(contractsDir, 'Cargo.toml');
  
  try {
    let workspaceCargo = fs.readFileSync(workspaceCargoPath, 'utf8');

    // Find the members array and remove the contract
    const membersMatch = workspaceCargo.match(/members\s*=\s*\[([\s\S]*?)\]/);
    if (membersMatch) {
      const membersContent = membersMatch[1];
      const members = membersContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('"'))
        .map(line => line.replace(/[",]/g, ''))
        .filter(Boolean)
        .filter(m => m !== contractName); // Remove the contract

      if (members.length > 0) {
        const newMembersContent = members.map(m => `  "${m}",`).join('\n');
        const newMembersSection = `members = [\n${newMembersContent}\n]`;

        workspaceCargo = workspaceCargo.replace(
          /members\s*=\s*\[[\s\S]*?\]/,
          newMembersSection
        );
      } else {
        // If no members left, create empty array
        const newMembersSection = `members = []`;
        workspaceCargo = workspaceCargo.replace(
          /members\s*=\s*\[[\s\S]*?\]/,
          newMembersSection
        );
      }

      fs.writeFileSync(workspaceCargoPath, workspaceCargo);
      console.log('✅ Updated workspace Cargo.toml');
    } else {
      console.warn('⚠️  Could not find members section in Cargo.toml');
    }
  } catch (error) {
    console.error(`❌ Error updating Cargo.toml: ${error.message}`);
    
    // Log detailed error information
    if (error.stack) {
      console.error('\x1b[90m' + error.stack + '\x1b[0m');
    }
    
    process.exit(1);
  }

  // Check for contract-specific entries in deployment.json
  const deploymentPath = path.join(__dirname, '..', 'deployment.json');
  if (fs.existsSync(deploymentPath)) {
    try {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      const networkKeys = ['testnet', 'futurenet', 'localnet', 'mainnet'];
      let foundDeployment = false;

      networkKeys.forEach(network => {
        if (deployment[network] && deployment[network][contractName]) {
          foundDeployment = true;
        }
      });

      if (foundDeployment) {
        console.log('\n⚠️  Note: Contract deployment information found in deployment.json');
        console.log('   You may want to manually clean up deployment entries if needed.');
      }
    } catch (error) {
      // Ignore errors reading deployment.json
    }
  }

  // Automatically clean frontend files
  const frontendContractPath = path.join(__dirname, '..', 'frontend', 'contracts', `${contractName}.ts`);
  const frontendPackagePath = path.join(__dirname, '..', 'frontend', 'packages', contractName);
  
  let frontendFilesRemoved = 0;
  
  // Remove contract import file
  if (fs.existsSync(frontendContractPath)) {
    try {
      fs.unlinkSync(frontendContractPath);
      console.log(`✅ Removed frontend/contracts/${contractName}.ts`);
      frontendFilesRemoved++;
    } catch (error) {
      console.warn(`⚠️  Could not remove frontend/contracts/${contractName}.ts: ${error.message}`);
    }
  }
  
  // Remove package directory
  if (fs.existsSync(frontendPackagePath)) {
    try {
      fs.rmSync(frontendPackagePath, { recursive: true, force: true });
      console.log(`✅ Removed frontend/packages/${contractName}/`);
      frontendFilesRemoved++;
    } catch (error) {
      console.warn(`⚠️  Could not remove frontend/packages/${contractName}/: ${error.message}`);
    }
  }

  if (frontendFilesRemoved > 0) {
    console.log(`\n✅ Cleaned ${frontendFilesRemoved} frontend file(s) for this contract`);
  }

  console.log(`
✨ Contract '${contractName}' removed successfully!

📦 Cleaned up:
   ✓ Removed contracts/${contractName}/
   ✓ Updated workspace Cargo.toml
   ${frontendFilesRemoved > 0 ? `✓ Removed ${frontendFilesRemoved} frontend file(s)` : ''}

🔄 Next steps:
   1. If contract was deployed, consider cleaning deployment entries
   2. Run 'yarn deploy:testnet' to regenerate frontend bindings for remaining contracts
   3. Run 'yarn build:contracts' to verify remaining contracts build successfully

💡 Tips:
   - Use 'yarn clean:frontend' to remove all auto-generated frontend files
   - Use 'yarn initcontract ${contractName}' to recreate this contract if needed
`);
}

// Run the removal
removeContract().catch(error => {
  console.error(`\n❌ Unexpected error: ${error.message}`);
  
  // Log detailed error information
  if (error.stack) {
    console.error('\x1b[90m' + error.stack + '\x1b[0m');
  }
  
  process.exit(1);
});
