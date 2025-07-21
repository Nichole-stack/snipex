export interface SnipeTarget {
  tokenAddress: string;
  tokenSymbol: string;
  targetAmount: string;
  maxGasPrice: string;
  slippageTolerance: number;
  userId: number;
  chatId: number;
  createdAt: Date;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
}
