#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env};

#[contract]
pub struct Increment;

#[contractimpl]
impl Increment {
    /// Increment increments an internal counter, returning the new value.
    pub fn increment(env: Env) -> u32 {
        // Get the current count.
        let mut count: u32 = env
            .storage()
            .instance()
            .get(&symbol_short!("count"))
            .unwrap_or(0); // If no value set, assume 0.

        // Increment the count.
        count += 1;

        // Save the count.
        env.storage().instance().set(&symbol_short!("count"), &count);

        // Return the count to the caller.
        count
    }

    /// Decrement decrements an internal counter, returning the new value.
    pub fn decrement(env: Env) -> u32 {
        // Get the current count.
        let mut count: u32 = env
            .storage()
            .instance()
            .get(&symbol_short!("count"))
            .unwrap_or(0); // If no value set, assume 0.

        // Decrement the count (but don't go below 0).
        if count > 0 {
            count -= 1;
        }

        // Save the count.
        env.storage().instance().set(&symbol_short!("count"), &count);

        // Return the count to the caller.
        count
    }

    /// Reset resets the counter to zero.
    pub fn reset(env: Env) {
        env.storage().instance().set(&symbol_short!("count"), &0);
    }

    /// Get the current count.
    pub fn get_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&symbol_short!("count"))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
