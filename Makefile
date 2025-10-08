# ScaffoldStellar Makefile

.PHONY: help setup build test deploy clean dev lint format

# Default target
help:
	@echo "ScaffoldStellar - Available commands:"
	@echo ""
	@echo "  setup     - Initial project setup"
	@echo "  build     - Build contracts and frontend"
	@echo "  test      - Run all tests"
	@echo "  deploy    - Deploy contracts to testnet"
	@echo "  build-packages - Build all contract packages"
	@echo "  generate-clients - Generate contract client files"
	@echo "  test-dynamic-contracts - Test dynamic contract system"
	@echo "  post-deploy - Run post-deployment tasks"
	@echo "  clean     - Clean build artifacts"
	@echo "  dev       - Start development server"
	@echo "  lint      - Run linter"
	@echo "  format    - Format code"
	@echo ""

# Setup
setup:
	@echo "Setting up ScaffoldStellar..."
	@yarn install
	@node scripts/setup.js

# Build
build: build-contracts build-frontend

build-contracts:
	@echo "Building contracts..."
	@cd contracts && cargo build --target wasm32v1-none --release

build-frontend:
	@echo "Building frontend..."
	@yarn workspace frontend build

# Test
test: test-contracts test-frontend

test-contracts:
	@echo "Testing contracts..."
	@cd contracts && cargo test

test-frontend:
	@echo "Testing frontend..."
	@yarn workspace frontend test

# Deploy
deploy: deploy-testnet

deploy-testnet:
	@echo "Deploying to testnet..."
	@node scripts/deploy-testnet.js

build-packages:
	@echo "Building contract packages..."
	@yarn build:packages

generate-clients:
	@echo "Generating contract clients..."
	@yarn generate:clients

test-dynamic-contracts:
	@echo "Testing dynamic contract system..."
	@yarn test:dynamic-contracts

post-deploy:
	@echo "Running post-deployment tasks..."
	@yarn post-deploy

deploy-futurenet:
	@echo "Deploying to futurenet..."
	@node scripts/deploy-futurenet.js

deploy-auto:
	@echo "Auto-deploying all contracts..."
	@node scripts/deploy-auto.js

detect-contracts:
	@echo "Detecting contracts and generating components..."
	@node scripts/auto-detect-contracts.js

# Clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf contracts/target
	@rm -rf frontend/.next
	@rm -rf frontend/out
	@rm -rf node_modules
	@rm -rf frontend/node_modules

# Development
dev:
	@echo "Starting development server..."
	@yarn dev

# Lint
lint:
	@echo "Running linter..."
	@yarn lint

# Format
format:
	@echo "Formatting code..."
	@yarn format

# Optimize contracts
optimize:
	@echo "Optimizing contracts..."
	@cd contracts && stellar contract optimize --wasm target/wasm32v1-none/release/hello_world.wasm
	@cd contracts && stellar contract optimize --wasm target/wasm32v1-none/release/increment.wasm
	@cd contracts && stellar contract optimize --wasm target/wasm32v1-none/release/token.wasm

# Generate docs
docs:
	@echo "Generating documentation..."
	@node scripts/generate-docs.js
