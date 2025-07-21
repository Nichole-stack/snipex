export interface RiskSettings {
  maxDailyLoss: number;
  maxSlippage: number;
  maxGasPrice: string;
  cooldownPeriod: number;
  maxSnipesPerDay: number;
}

export interface RiskMetrics {
  dailyLoss: number;
  snipesCount: number;
  successRate: number;
  avgGasUsed: string;
}

export class RiskManager {
  private userRiskSettings: Map<number, RiskSettings> = new Map();
  private userMetrics: Map<number, RiskMetrics> = new Map();

  constructor() {
    // Default risk settings
    this.setDefaultRiskSettings();
  }

  private setDefaultRiskSettings(): void {
    // These will be applied to new users
  }

  setUserRiskSettings(userId: number, settings: Partial<RiskSettings>): void {
    const currentSettings = this.getUserRiskSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    this.userRiskSettings.set(userId, updatedSettings);
  }

  getUserRiskSettings(userId: number): RiskSettings {
    return this.userRiskSettings.get(userId) || {
      maxDailyLoss: 20, // 20% max daily loss
      maxSlippage: 5,   // 5% max slippage
      maxGasPrice: '50', // 50 gwei max
      cooldownPeriod: 300000, // 5 minutes
      maxSnipesPerDay: 10
    };
  }

  async checkRiskLimits(userId: number, amount: string, gasPrice: string): Promise<{ allowed: boolean; reason?: string }> {
    const settings = this.getUserRiskSettings(userId);
    const metrics = this.getUserMetrics(userId);

    // Check daily loss limit
    if (metrics.dailyLoss >= settings.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached (${settings.maxDailyLoss}%)`
      };
    }

    // Check daily snipes limit
    if (metrics.snipesCount >= settings.maxSnipesPerDay) {
      return {
        allowed: false,
        reason: `Daily snipes limit reached (${settings.maxSnipesPerDay})`
      };
    }

    // Check gas price limit
    const gasPriceNum = parseFloat(gasPrice);
    const maxGasPriceNum = parseFloat(settings.maxGasPrice);
    if (gasPriceNum > maxGasPriceNum) {
      return {
        allowed: false,
        reason: `Gas price too high (${gasPrice} > ${settings.maxGasPrice} gwei)`
      };
    }

    return { allowed: true };
  }

  updateUserMetrics(userId: number, snipeResult: any): void {
    const currentMetrics = this.getUserMetrics(userId);
    
    // Update snipe count
    currentMetrics.snipesCount += 1;
    
    // Update success rate
    if (snipeResult.success) {
      // Calculate new success rate
      const totalSnipes = currentMetrics.snipesCount;
      const successfulSnipes = Math.floor(currentMetrics.successRate * (totalSnipes - 1) / 100) + 1;
      currentMetrics.successRate = (successfulSnipes / totalSnipes) * 100;
    }
    
    // Update gas usage
    if (snipeResult.gasUsed) {
      currentMetrics.avgGasUsed = snipeResult.gasUsed;
    }

    this.userMetrics.set(userId, currentMetrics);
  }

  getUserMetrics(userId: number): RiskMetrics {
    return this.userMetrics.get(userId) || {
      dailyLoss: 0,
      snipesCount: 0,
      successRate: 0,
      avgGasUsed: '0'
    };
  }

  resetDailyMetrics(userId: number): void {
    const metrics = this.getUserMetrics(userId);
    metrics.dailyLoss = 0;
    metrics.snipesCount = 0;
    this.userMetrics.set(userId, metrics);
  }

  isInCooldown(userId: number): boolean {
    // Implementation would check last snipe time against cooldown period
    return false; // Simplified for now
  }

  getCooldownRemaining(userId: number): number {
    // Return remaining cooldown time in milliseconds
    return 0; // Simplified for now
  }
}
