#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Env, Symbol, Vec};

#[contract]
pub struct HelloWorld;

#[contractimpl]
impl HelloWorld {
    /// Returns a simple greeting message
    pub fn hello(env: Env, to: Symbol) -> Vec<Symbol> {
        vec![&env, symbol_short!("Hello"), to]
    }

    /// Returns a greeting with a custom message
    pub fn greet(_env: Env, _name: Symbol) -> Symbol {
        symbol_short!("Hello")
    }

    /// Returns version information
    pub fn version() -> u32 {
        1
    }
}

#[cfg(test)]
mod test;
