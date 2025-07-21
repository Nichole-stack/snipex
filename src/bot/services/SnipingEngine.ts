import { WalletManager } from './WalletManager';
import { MEVEngine } from './MEVEngine';
import { ethers } from 'ethers';

export interface SnipeTarget {
  contractAddress: string;
  tokenSymbol: string;
  launchTime: Date;
  maxGasPrice: string;
  slippage: number;
  amount: string;
}

export interface SnipeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  tokensBought?: string;
}

export class SnipingEngine {
  private walletManager: WalletManager;
  private mevEngine: MEVEngine;
  private activeSnipes: Map<string, SnipeTarget> = new Map();

  constructor(walletManager: WalletManager, mevEngine: MEVEngine) {
    this.walletManager = walletManager;
    this.mevEngine = mevEngine;
  }

  async scheduleSnipe(userId: number, target: SnipeTarget): Promise<string> {
    const snipeId = `snipe_${Date.now()}_${userId}`;
    this.activeSnipes.set(snipeId, target);

    // Calculate time until launch
    const timeUntilLaunch = target.launchTime.getTime() - Date.now();
    
    if (timeUntilLaunch > 0) {
      setTimeout(() => {
        this.executeSnipe(userId, snipeId);
      }, timeUntilLaunch);
      
      return snipeId;
    } else {
      // Launch time has passed, execute immediately
      return await this.executeSnipe(userId, snipeId);
    }
  }

  private async executeSnipe(userId: number, snipeId: string): Promise<string> {
    const target = this.activeSnipes.get(snipeId);
    if (!target) {
      throw new Error('Snipe target not found');
    }

    try {
      // Check if wallet is connected
      if (!this.walletManager.isWalletConnected(userId)) {
        throw new Error('Wallet not connected');
      }

      // Get optimal gas price from MEV engine
      const gasPrice = await this.mevEngine.calculateOptimalGasPrice();
      
      // Prepare transaction
      const transaction = {
        to: target.contractAddress,
        value: ethers.parseEther(target.amount),
        gasPrice: ethers.parseUnits(gasPrice, 'gwei'),
        gasLimit: 300000
      };

      // Simulate transaction first
      const simulationSuccess = await this.mevEngine.simulateTransaction(transaction);
      if (!simulationSuccess) {
        throw new Error('Transaction simulation failed');
      }

      // Execute the snipe
      const txHash = await this.walletManager.sendTransaction(userId, transaction);
      
      // Clean up
      this.activeSnipes.delete(snipeId);
      
      return txHash;
    } catch (error) {
      this.activeSnipes.delete(snipeId);
      throw error;
    }
  }

  async cancelSnipe(snipeId: string): Promise<boolean> {
    return this.activeSnipes.delete(snipeId);
  }

  getActiveSnipes(): SnipeTarget[] {
    return Array.from(this.activeSnipes.values());
  }

  async estimateSnipeCost(target: SnipeTarget): Promise<string> {
    try {
      const gasPrice = await this.mevEngine.calculateOptimalGasPrice();
      const gasLimit = 300000;
      const gasCost = ethers.parseUnits(gasPrice, 'gwei') * BigInt(gasLimit);
      const totalCost = ethers.parseEther(target.amount) + gasCost;
      
      return ethers.formatEther(totalCost);
    } catch (error) {
      throw new Error(`Failed to estimate snipe cost: ${error}`);
    }
  }
}
