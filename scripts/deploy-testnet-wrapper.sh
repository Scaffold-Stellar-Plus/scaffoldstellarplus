#!/bin/bash
# Wrapper script to pass arguments to deploy-testnet.js

cd "$(dirname "$0")/.."
node scripts/deploy-testnet.js "$1" && \
  yarn build:packages && \
  yarn generate:contract-imports && \
  yarn generate:metadata && \
  node scripts/copy-deployment-files.js

