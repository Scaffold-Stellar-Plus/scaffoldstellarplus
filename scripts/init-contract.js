#!/usr/bin/env node

/**
 * Script to initialize a new Soroban smart contract
 * Creates contract boilerplate following Stellar's best practices
 * 
 * Usage: yarn initcontract <contract_name>
 */

const fs = require('fs');
const path = require('path');

// Get contract name from command line args
const contractName = process.argv[2];

if (!contractName) {
  console.error('❌ Error: Contract name is required');
  console.log('Usage: yarn initcontract <contract_name>');
  process.exit(1);
}

// Validate contract name (alphanumeric and underscores only)
if (!/^[a-z][a-z0-9_]*$/.test(contractName)) {
  console.error('❌ Error: Contract name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores');
  console.log('Example: yarn initcontract my_token');
  process.exit(1);
}

const contractsDir = path.join(__dirname, '..', 'contracts');
const contractDir = path.join(contractsDir, contractName);
const contractSrcDir = path.join(contractDir, 'src');

// Check if contract already exists
if (fs.existsSync(contractDir)) {
  console.error(`❌ Error: Contract '${contractName}' already exists`);
  process.exit(1);
}

console.log(`🚀 Initializing new contract: ${contractName}\n`);

// Convert snake_case to PascalCase for struct name
function toPascalCase(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

const structName = toPascalCase(contractName);
const clientName = `${structName}Client`;

// Create contract directories
console.log('📁 Creating directories...');
fs.mkdirSync(contractDir, { recursive: true });
fs.mkdirSync(contractSrcDir, { recursive: true });

// Create Cargo.toml for the contract
const cargoToml = `[package]
name = "${contractName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = { workspace = true }

[dev-dependencies]
soroban-sdk = { workspace = true, features = ["testutils"] }
`;

console.log('📝 Creating Cargo.toml...');
fs.writeFileSync(path.join(contractDir, 'Cargo.toml'), cargoToml);

// Create lib.rs (main contract code)
const libRs = `#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

/// ${structName} smart contract
#[contract]
pub struct ${structName};

#[contractimpl]
impl ${structName} {
    /// Constructor - called during contract deployment
    /// This function is automatically detected by the deployment system
    pub fn __constructor(e: Env, admin: Address) {
        e.storage().instance().set(&symbol_short!("admin"), &admin);
    }

    /// Get the admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&symbol_short!("admin"))
            .unwrap_or_else(|| panic!("Admin not set"))
    }
    
    /// Example function - replace with your contract logic
    pub fn hello(_env: Env, to: Symbol) -> Symbol {
        // Echo back the input for demonstration
        to
    }

    /// Returns the contract version
    pub fn version() -> u32 {
        1
    }
}

#[cfg(test)]
mod test;
`;

console.log('📝 Creating src/lib.rs...');
fs.writeFileSync(path.join(contractSrcDir, 'lib.rs'), libRs);

// Create test.rs (unit tests)
const testRs = `use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

use crate::{${structName}, ${clientName}};

#[test]
fn test_constructor_and_get_admin() {
    let env = Env::default();
    
    // Create a test admin address
    let admin = Address::generate(&env);

    // Register contract with constructor arguments
    // In Soroban, constructor arguments are passed directly to env.register()
    let contract_id = env.register(${structName}, (&admin,));
    
    // Create client and verify admin was set correctly
    let client = ${clientName}::new(&env, &contract_id);
    let retrieved_admin = client.get_admin();
    assert_eq!(admin, retrieved_admin);
}

#[test]
fn test_hello() {
    let env = Env::default();
    let admin = Address::generate(&env);
    
    // Register contract with constructor arguments
    let contract_id = env.register(${structName}, (&admin,));
    let client = ${clientName}::new(&env, &contract_id);

    // Test that hello echoes back the input
    let input = symbol_short!("World");
    let result = client.hello(&input);
    assert_eq!(result, input);
    
    // Test with different input
    let input2 = symbol_short!("Stellar");
    let result2 = client.hello(&input2);
    assert_eq!(result2, input2);
}

#[test]
fn test_version() {
    let env = Env::default();
    let admin = Address::generate(&env);
    
    // Register contract with constructor arguments
    let contract_id = env.register(${structName}, (&admin,));
    let client = ${clientName}::new(&env, &contract_id);

    let version = client.version();
    assert_eq!(version, 1);
}

#[test]
fn test_constructor_works_correctly() {
    let env = Env::default();
    let admin = Address::generate(&env);
    
    // Register contract with constructor arguments
    let contract_id = env.register(${structName}, (&admin,));
    let client = ${clientName}::new(&env, &contract_id);
    
    // Verify constructor worked correctly
    let retrieved_admin = client.get_admin();
    assert_eq!(admin, retrieved_admin);
    
    // Test that the contract functions work
    let input = symbol_short!("Test");
    let result = client.hello(&input);
    assert_eq!(result, input);
    
    let version = client.version();
    assert_eq!(version, 1);
}
`;

console.log('📝 Creating src/test.rs...');
fs.writeFileSync(path.join(contractSrcDir, 'test.rs'), testRs);

// Update workspace Cargo.toml
console.log('📝 Updating workspace Cargo.toml...');
const workspaceCargoPath = path.join(contractsDir, 'Cargo.toml');
let workspaceCargo = fs.readFileSync(workspaceCargoPath, 'utf8');

// Find the members array and add the new contract
const membersMatch = workspaceCargo.match(/members\s*=\s*\[([\s\S]*?)\]/);
if (membersMatch) {
  const membersContent = membersMatch[1];
  const members = membersContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('"'))
    .map(line => line.replace(/[",]/g, ''))
    .filter(Boolean);

  // Add new contract if not already present
  if (!members.includes(contractName)) {
    members.push(contractName);
    members.sort(); // Keep alphabetically sorted

    const newMembersContent = members.map(m => `  "${m}",`).join('\n');
    const newMembersSection = `members = [\n${newMembersContent}\n]`;

    workspaceCargo = workspaceCargo.replace(
      /members\s*=\s*\[[\s\S]*?\]/,
      newMembersSection
    );

    fs.writeFileSync(workspaceCargoPath, workspaceCargo);
    console.log('✅ Updated workspace Cargo.toml members');
  }
}

console.log(`
✨ Contract '${contractName}' initialized successfully!

📂 Structure created:
   contracts/${contractName}/
   ├── Cargo.toml
   └── src/
       ├── lib.rs
       └── test.rs

🔧 Constructor Features:
   • Contract includes __constructor with admin parameter
   • Deployment system will auto-detect constructor arguments
   • Interactive prompts will collect admin address during deployment

🔍 Next steps:
   1. Implement your contract logic in contracts/${contractName}/src/lib.rs
   2. Add tests in contracts/${contractName}/src/test.rs
   3. Run tests: yarn test:contracts
   4. Build: yarn build:contracts
   5. Deploy: yarn deploy:testnet (will prompt for admin address)

📚 Learn more: https://developers.stellar.org/docs/build/smart-contracts
`);
