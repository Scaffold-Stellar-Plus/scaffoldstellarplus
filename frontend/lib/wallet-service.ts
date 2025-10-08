import {
  allowAllModules,
  StellarWalletsKit,
  WalletNetwork,
} from "@creit.tech/stellar-wallets-kit";
import * as Stellar from '@stellar/stellar-sdk';
import { stellarService } from './stellar';

const SELECTED_WALLET_ID = "selectedWalletId";
const FREIGHTER_ID = "freighter";

export interface WalletInfo {
  id: string;
  name: string;
  icon: string;
  isInstalled: boolean;
  isConnected: boolean;
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  keypair: Stellar.Keypair | null;
  walletId: string | null;
  walletName: string | null;
  network: string;
  error: string | null;
}

// Check if we're on mobile
const isMobile = () => {
  if (typeof window === "undefined") return false;
  
  // Check user agent for mobile keywords
  const userAgent = navigator.userAgent.toLowerCase();
  const hasMobileKeywords = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check if we're in Chrome DevTools device simulation
  const isInDevTools = userAgent.includes('android') && window.innerWidth > 1024;
  
  // If we have mobile keywords but large screen, we're likely in DevTools simulation
  return hasMobileKeywords && !isInDevTools;
};

function getSelectedWalletId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_WALLET_ID);
}

function setSelectedWalletId(walletId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SELECTED_WALLET_ID, walletId);
  }
}

function clearSelectedWalletId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SELECTED_WALLET_ID);
  }
}

// Get network configuration
const getNetworkConfig = () => {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
  
  switch (network) {
    case 'testnet':
      return "Test SDF Network ; September 2015" as WalletNetwork;
    case 'mainnet':
      return "Public Global Stellar Network ; September 2015" as WalletNetwork;
    case 'futurenet':
      return "Test SDF Future Network ; October 2022" as WalletNetwork;
    default:
      return "Test SDF Network ; September 2015" as WalletNetwork;
  }
};

// Initialize kit only on client side
let kit: StellarWalletsKit | null = null;

const getKit = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!kit) {
    kit = new StellarWalletsKit({
      modules: allowAllModules(),
      network: getNetworkConfig(),
      selectedWalletId: getSelectedWalletId() ?? FREIGHTER_ID
    });
  }
  
  return kit;
};

export class WalletService {
  private static instance: WalletService;
  private walletState: WalletState = {
    isConnected: false,
    publicKey: null,
    keypair: null,
    walletId: null,
    walletName: null,
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
    error: null
  };
  
  private listeners: ((state: WalletState) => void)[] = [];

  private constructor() {
    this.initializeWallet();
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.walletState));
  }

  private updateState(updates: Partial<WalletState>) {
    this.walletState = { ...this.walletState, ...updates };
    this.notifyListeners();
  }

  private async initializeWallet() {
    if (typeof window === "undefined") return;

    try {
      const walletKit = getKit();
      if (!walletKit) return;

      const selectedWalletId = getSelectedWalletId();
      if (selectedWalletId) {
        await walletKit.setWallet(selectedWalletId);
        const { address } = await walletKit.getAddress();
        
      const keypair = Stellar.Keypair.fromPublicKey(address);
      this.updateState({
        isConnected: true,
        publicKey: address,
        keypair,
        walletId: selectedWalletId,
        walletName: this.getWalletName(selectedWalletId),
        error: null
      });
      
      // Update stellar service with the keypair and sign function
      stellarService.setKeypair(keypair);
      stellarService.setSignTransaction(async (tx) => {
        const result = await this.signTransaction(tx);
        return result as Stellar.Transaction;
      });
      }
    } catch (error) {
      console.log('No wallet connected on initialization:', error);
      clearSelectedWalletId();
    }
  }

  private getWalletName(walletId: string): string {
    const walletNames: Record<string, string> = {
      'freighter': 'Freighter',
      'albedo': 'Albedo',
      'lobstr': 'Lobstr',
      'rabet': 'Rabet',
      'xbull': 'xBull',
      'temple': 'Temple',
      'walletconnect': 'WalletConnect'
    };
    return walletNames[walletId] || walletId;
  }

  public subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getState(): WalletState {
    return this.walletState;
  }

  public async connect(): Promise<void> {
    try {
      this.updateState({ error: null });

      const walletKit = getKit();
      if (!walletKit) {
        this.updateState({ 
          error: 'Wallet service not available on server side'
        });
        return;
      }

      // Comprehensive debugging
      if (typeof window !== "undefined") {
        console.log("=== WALLET DEBUGGING ===");
        console.log("1. Window object available:", !!window);
        console.log("2. Is mobile browser:", isMobile());
        console.log("3. Touch capability:", 'ontouchstart' in window || navigator.maxTouchPoints > 0);
        console.log("4. Screen width:", window.innerWidth);
        console.log("5. User agent:", navigator.userAgent);
        console.log("6. Freighter API available:", !!(window as any).freighterApi);
        console.log("7. Freighter version:", (window as any).freighterApi?.version);
        console.log("8. Current network:", getNetworkConfig());
        console.log("9. Protocol:", window.location.protocol);
        console.log("10. Hostname:", window.location.hostname);
        
        // Check for specific wallet extensions
        console.log("11. Checking wallet extensions:");
        console.log("   - Freighter:", !!(window as any).freighterApi);
        console.log("   - Lobstr:", !!(window as any).lobstr);
        console.log("   - Albedo:", !!(window as any).albedo);
        console.log("   - Rabet:", !!(window as any).rabet);
        
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
            console.log("12. Freighter connected:", isConnected);
          } catch (e) {
            console.log("12. Freighter connection test failed:", e);
          }
        }
      }
      
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          try {
            console.log("Selected wallet:", option.id);
            await this.setWallet(option.id);
          } catch (e) {
            console.error("Error connecting wallet:", e);
            this.updateState({ 
              error: e instanceof Error ? e.message : 'Failed to connect wallet'
            });
          }
          return option.id;
        },
      });
    } catch (error) {
      console.error("Error opening wallet modal:", error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to open wallet modal'
      });
    }
  }

  public async disconnect(): Promise<void> {
    try {
      clearSelectedWalletId();
      const walletKit = getKit();
      if (walletKit) {
        await walletKit.disconnect();
      }
      
      this.updateState({
        isConnected: false,
        publicKey: null,
        keypair: null,
        walletId: null,
        walletName: null,
        error: null
      });
      
      // Clear stellar service
      stellarService.setKeypair(undefined as any);
      stellarService.setSignTransaction(undefined as any);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet'
      });
    }
  }

  public async setWallet(walletId: string): Promise<void> {
    try {
      const walletKit = getKit();
      if (!walletKit) {
        throw new Error('Wallet service not available on server side');
      }

      await walletKit.setWallet(walletId);
      setSelectedWalletId(walletId);
      
      const { address } = await walletKit.getAddress();
      
      const keypair = Stellar.Keypair.fromPublicKey(address);
      this.updateState({
        isConnected: true,
        publicKey: address,
        keypair,
        walletId,
        walletName: this.getWalletName(walletId),
        error: null
      });
      
      // Update stellar service with the keypair and sign function
      stellarService.setKeypair(keypair);
      stellarService.setSignTransaction(async (tx) => {
        const result = await this.signTransaction(tx);
        return result as Stellar.Transaction;
      });
    } catch (error) {
      console.error("Error setting wallet:", error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to set wallet'
      });
      throw error;
    }
  }

  public async getPublicKey(): Promise<string | null> {
    try {
      if (!this.walletState.isConnected) return null;
      const walletKit = getKit();
      if (!walletKit) return null;
      const { address } = await walletKit.getAddress();
      return address;
    } catch (error) {
      console.error("Error getting public key:", error);
      return null;
    }
  }

  public async signTransaction(transaction: Stellar.Transaction): Promise<Stellar.Transaction | Stellar.FeeBumpTransaction> {
    try {
      if (!this.walletState.isConnected) {
        throw new Error('Wallet not connected');
      }
      const walletKit = getKit();
      if (!walletKit) {
        throw new Error('Wallet service not available on server side');
      }
      const signedResult = await walletKit.signTransaction(transaction.toXDR());
      // Convert back to Stellar Transaction if needed
      return Stellar.TransactionBuilder.fromXDR(signedResult.signedTxXdr, this.walletState.network);
    } catch (error) {
      console.error("Error signing transaction:", error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to sign transaction'
      });
      throw error;
    }
  }

  public async getAvailableWallets(): Promise<WalletInfo[]> {
    if (typeof window === "undefined") return [];

    const wallets: WalletInfo[] = [
      {
        id: 'freighter',
        name: 'Freighter',
        icon: '🚀',
        isInstalled: !!(window as any).freighterApi,
        isConnected: this.walletState.walletId === 'freighter'
      },
      {
        id: 'albedo',
        name: 'Albedo',
        icon: '🌅',
        isInstalled: !!(window as any).albedo,
        isConnected: this.walletState.walletId === 'albedo'
      },
      {
        id: 'lobstr',
        name: 'Lobstr',
        icon: '🦞',
        isInstalled: !!(window as any).lobstr,
        isConnected: this.walletState.walletId === 'lobstr'
      },
      {
        id: 'rabet',
        name: 'Rabet',
        icon: '🐰',
        isInstalled: !!(window as any).rabet,
        isConnected: this.walletState.walletId === 'rabet'
      },
      {
        id: 'xbull',
        name: 'xBull',
        icon: '🐂',
        isInstalled: !!(window as any).xbull,
        isConnected: this.walletState.walletId === 'xbull'
      },
      {
        id: 'temple',
        name: 'Temple',
        icon: '🏛️',
        isInstalled: !!(window as any).temple,
        isConnected: this.walletState.walletId === 'temple'
      }
    ];

    return wallets.filter(wallet => wallet.isInstalled || wallet.isConnected);
  }

  public async switchNetwork(network: string): Promise<void> {
    try {
      const walletKit = getKit();
      if (!walletKit) {
        this.updateState({ 
          error: 'Wallet service not available on server side'
        });
        return;
      }

      // Update network configuration
      const networkConfig = network === 'mainnet' 
        ? "Public Global Stellar Network ; September 2015" as WalletNetwork
        : network === 'futurenet'
        ? "Test SDF Future Network ; October 2022" as WalletNetwork
        : "Test SDF Network ; September 2015" as WalletNetwork;

      // Note: StellarWalletsKit doesn't have a setNetwork method
      // Network switching would require reinitializing the kit
      // For now, we'll just update the state
      
      this.updateState({ 
        network,
        error: null
      });
    } catch (error) {
      console.error("Error switching network:", error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Failed to switch network'
      });
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();
