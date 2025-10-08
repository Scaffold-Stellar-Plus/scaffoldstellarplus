use soroban_sdk::{symbol_short, vec, Env, testutils::Address as _};

use crate::{HelloWorld, HelloWorldClient};

#[test]
fn test() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloWorld);
    let client = HelloWorldClient::new(&env, &contract_id);

    let words = client.hello(&symbol_short!("Dev"));
    assert_eq!(
        words,
        vec![&env, symbol_short!("Hello"), symbol_short!("Dev")]
    );
}

#[test]
fn test_greet() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloWorld);
    let client = HelloWorldClient::new(&env, &contract_id);

    let greeting = client.greet(&symbol_short!("World"));
    assert_eq!(greeting, symbol_short!("Hello"));
}

#[test]
fn test_version() {
    let env = Env::default();
    let contract_id = env.register_contract(None, HelloWorld);
    let client = HelloWorldClient::new(&env, &contract_id);

    let version = client.version();
    assert_eq!(version, 1);
}
