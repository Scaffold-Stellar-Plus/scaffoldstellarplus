#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

#[contract]
pub struct Token;

#[contractimpl]
impl Token {
    pub fn initialize(env: Env, admin: Address, decimal: u32, name: Symbol, symbol: Symbol) {
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.storage().instance().set(&symbol_short!("decimal"), &decimal);
        env.storage().instance().set(&symbol_short!("name"), &name);
        env.storage().instance().set(&symbol_short!("symbol"), &symbol);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&symbol_short!("admin")).unwrap();
        admin.require_auth();
        
        let balance: i128 = env.storage().instance().get(&to).unwrap_or(0);
        env.storage().instance().set(&to, &(balance + amount));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().instance().get(&id).unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        
        let from_balance: i128 = env.storage().instance().get(&from).unwrap_or(0);
        if from_balance < amount {
            panic!("Insufficient balance");
        }
        
        let to_balance: i128 = env.storage().instance().get(&to).unwrap_or(0);
        
        env.storage().instance().set(&from, &(from_balance - amount));
        env.storage().instance().set(&to, &(to_balance + amount));
    }

    pub fn name(env: Env) -> Symbol {
        env.storage().instance().get(&symbol_short!("name")).unwrap()
    }

    pub fn symbol(env: Env) -> Symbol {
        env.storage().instance().get(&symbol_short!("symbol")).unwrap()
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("decimal")).unwrap()
    }
}

#[cfg(test)]
mod test;
