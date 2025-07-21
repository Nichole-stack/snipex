import { ethers } from 'ethers';

export class WalletManager {
  private provider: ethers.JsonRpcProvider;
  private wallets: Map<number, ethers.Wallet | ethers.HDNodeWallet> = new Map();

  constructor() {
    const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async connectWallet(userId: number, privateKey?: string): Promise<string> {
    try {
      let wallet: ethers.Wallet | ethers.HDNodeWallet;
      
      if (privateKey) {
        wallet = new ethers.Wallet(privateKey, this.provider);
      } else {
        // Generate new wallet and connect to provider
        const randomWallet = ethers.Wallet.createRandom();
        wallet = randomWallet.connect(this.provider) as ethers.HDNodeWallet;
      }

      this.wallets.set(userId, wallet);
      return wallet.address;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`);
    }
  }

  async getBalance(userId: number): Promise<string> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.getBalance(wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async signTransaction(userId: number, transaction: any): Promise<string> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedTx = await wallet.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  async sendTransaction(userId: number, transaction: any): Promise<string> {
    const wallet = this.wallets.get(userId);
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await wallet.sendTransaction(transaction);
      return tx.hash;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  getWalletAddress(userId: number): string | undefined {
    const wallet = this.wallets.get(userId);
    return wallet?.address;
  }

  isWalletConnected(userId: number): boolean {
    return this.wallets.has(userId);
  }

  disconnectWallet(userId: number): void {
    this.wallets.delete(userId);
  }
}
