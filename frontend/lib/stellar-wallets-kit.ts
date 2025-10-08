import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";

const SELECTED_WALLET_ID = "selectedWalletId";
const FREIGHTER_ID = "freighter";

function getSelectedWalletId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_WALLET_ID);
}

// Check if we're on mobile
const isMobile = () => {
  if (typeof window === "undefined") return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const hasMobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isInDevTools = userAgent.includes('android') && window.innerWidth > 1024;

  return hasMobileKeywords && !isInDevTools;
};

// Lazy initialization - only create kit when needed and on client side
let kit: StellarWalletsKit | null = null;

function getKit(): StellarWalletsKit {
  if (typeof window === "undefined") {
    throw new Error("StellarWalletsKit can only be used on client side");
  }
  
  if (!kit) {
    kit = new StellarWalletsKit({
      modules: allowAllModules(),
      network: "Test SDF Network ; September 2015" as WalletNetwork,
      selectedWalletId: getSelectedWalletId() ?? FREIGHTER_ID
    });
  }
  
  return kit;
}

export const signTransaction = async (xdr: string, opts?: any) => {
  const walletKit = getKit();
  return walletKit.signTransaction(xdr, opts);
};

export async function getPublicKey() {
  if (typeof window === "undefined") return null;
  if (!getSelectedWalletId()) return null;
  
  try {
    const walletKit = getKit();
    const { address } = await walletKit.getAddress();
    return address;
  } catch (error) {
    console.error("Error getting public key:", error);
    return null;
  }
}

export async function setWallet(walletId: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SELECTED_WALLET_ID, walletId);
      const walletKit = getKit();
      await walletKit.setWallet(walletId);
    } catch (error) {
      console.error("Error setting wallet:", error);
    }
  }
}

export async function disconnect(callback?: () => Promise<void>) {
  if (typeof window !== "undefined") {
    try {
      const walletKit = getKit();
      await walletKit.disconnect();
      if (callback) await callback();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }
}

export async function connect(callback?: () => Promise<void>) {
  if (typeof window === "undefined") {
    console.error("Connect can only be called on client side");
    return;
  }
  
  try {
    const walletKit = getKit();
    
    // Comprehensive debugging
    console.log("=== WALLET DEBUGGING ===");
    console.log("1. Window object available:", !!window);
    console.log("2. Is mobile browser:", isMobile());
    console.log("3. Touch capability:", 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    console.log("4. Screen width:", window.innerWidth);
    console.log("5. User agent:", navigator.userAgent);
    console.log("6. Freighter API available:", !!(window as any).freighterApi);
    console.log("7. Freighter version:", (window as any).freighterApi?.version);
    console.log("8. Current network:", "Test SDF Network ; September 2015");
    console.log("9. Protocol:", window.location.protocol);
    console.log("10. Hostname:", window.location.hostname);
    console.log("11. Kit initialized:", !!walletKit);
    
    // Check for specific wallet extensions
    console.log("12. Checking wallet extensions:");
    console.log("   - Freighter:", !!(window as any).freighterApi);
    console.log("   - Lobstr:", !!(window as any).lobstr);
    console.log("   - Albedo:", !!(window as any).albedo);
    
    // Check for DevTools simulation
    const userAgent = navigator.userAgent.toLowerCase();
    const isInDevTools = userAgent.includes('android') && window.innerWidth > 1024;
    
    if (isInDevTools) {
      console.log("⚠️  DEVTOOLS SIMULATION DETECTED: You're in Chrome DevTools device simulation mode.");
      console.log("💡  To use wallet extensions, exit device simulation (click the device icon in DevTools).");
      console.log("💡  Or refresh the page after exiting simulation mode.");
    } else if (isMobile()) {
      console.log("⚠️  MOBILE DETECTED: Freighter and Lobstr are desktop Chrome extensions and won't work on mobile browsers.");
      console.log("💡  Consider using a mobile wallet or testing on desktop Chrome.");
    } else {
      console.log("✅  DESKTOP DETECTED: Wallet extensions should be available.");
    }
    console.log("==========================");
    
    // Test Freighter API directly
    if ((window as any).freighterApi) {
      try {
        const isConnected = await (window as any).freighterApi.isConnected();
        console.log("13. Freighter connected:", isConnected);
      } catch (e) {
        console.log("13. Freighter connection test failed:", e);
      }
    }
    
    await walletKit.openModal({
      onWalletSelected: async (option) => {
        try {
          console.log("Selected wallet:", option.id);
          await setWallet(option.id);
          if (callback) await callback();
        } catch (e) {
          console.error("Error connecting wallet:", e);
        }
        return option.id;
      },
    });
  } catch (error) {
    console.error("Error opening wallet modal:", error);
  }
}
