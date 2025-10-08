#!/bin/bash

# Test script to verify automatic version fixing works

echo "🧪 Testing Automatic Stellar SDK Version Fix"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if packages directory exists
if [ ! -d "frontend/packages" ]; then
  echo -e "${RED}❌ No packages directory found${NC}"
  echo "Run 'yarn deploy:testnet' first to generate packages"
  exit 1
fi

# Check each package
echo "📦 Checking package versions..."
echo ""

FAIL_COUNT=0
SUCCESS_COUNT=0

for pkg_dir in frontend/packages/*/; do
  pkg_name=$(basename "$pkg_dir")
  pkg_json="$pkg_dir/package.json"
  
  if [ -f "$pkg_json" ]; then
    version=$(grep '"@stellar/stellar-sdk"' "$pkg_json" | sed 's/.*: "\(.*\)".*/\1/')
    
    if [ "$version" == "14.0.0" ]; then
      echo -e "${GREEN}✅ $pkg_name: $version${NC}"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo -e "${RED}❌ $pkg_name: $version (should be 14.0.0)${NC}"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  fi
done

echo ""
echo "=============================================="
echo "📊 Test Results:"
echo "   Success: $SUCCESS_COUNT"
echo "   Failed:  $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}🎉 All packages have correct Stellar SDK version!${NC}"
  echo "The automatic version fix is working correctly."
  exit 0
else
  echo -e "${RED}⚠️  Some packages have incorrect versions${NC}"
  echo ""
  echo "To fix:"
  echo "1. Make sure you deployed with the updated scripts"
  echo "2. Run: yarn clean:frontend"
  echo "3. Run: yarn deploy:testnet"
  echo "4. The versions should auto-fix during deployment"
  exit 1
fi

