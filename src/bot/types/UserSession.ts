export interface UserSession {
  userId: number;
  chatId: number;
  walletConnected: boolean;
  cooldownUntil: Date | null;
  dailyLossLimit: number;
  dailyLosses: number;
  snipesCount: number;
  maxSnipesPerDay: number;
  whitelistMode: boolean;
  activeSnipes: Set<string>;
  lastActivity: Date;
}
