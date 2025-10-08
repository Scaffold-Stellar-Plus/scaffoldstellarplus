use soroban_sdk::{symbol_short, Address, Env, testutils::Address as _};

use crate::{Token, TokenClient};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Token);
    let client = TokenClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    
    client.initialize(
        &admin,
        &6,
        &symbol_short!("MyToken"),
        &symbol_short!("MTK")
    );
    
    let name = client.name();
    assert_eq!(name, symbol_short!("MyToken"));
}

#[test]
fn test_mint() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, Token);
    let client = TokenClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    
    client.initialize(&admin, &6, &symbol_short!("MyToken"), &symbol_short!("MTK"));
    client.mint(&user, &1000);
    
    let balance = client.balance(&user);
    assert_eq!(balance, 1000);
}
