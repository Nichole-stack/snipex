import TelegramBot from 'node-telegram-bot-api';
import { WalletManager } from '../services/WalletManager';
import { SnipingEngine } from '../services/SnipingEngine';
import { RiskManager } from '../services/RiskManager';
import { UserSession } from '../types/UserSession';

export class CommandHandler {
  private walletManager: WalletManager;
  private snipingEngine: SnipingEngine;
  private riskManager: RiskManager;
  private userSessions: Map<number, UserSession>;

  constructor(
    walletManager: WalletManager,
    snipingEngine: SnipingEngine,
    riskManager: RiskManager,
    userSessions: Map<number, UserSession>
  ) {
    this.walletManager = walletManager;
    this.snipingEngine = snipingEngine;
    this.riskManager = riskManager;
    this.userSessions = userSessions;
  }

  async handleCommand(msg: TelegramBot.Message, bot: TelegramBot): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text;

    if (!userId || !text) return;

    const session = this.userSessions.get(userId);
    if (!session) return;

    try {
      switch (text.split(' ')[0]) {
        case '/start':
          await this.handleStart(chatId, bot);
          break;
        case '/connectwallet':
          await this.handleConnectWallet(chatId, userId, bot);
          break;
        case '/balance':
          await this.handleBalance(chatId, userId, bot);
          break;
        case '/snipe':
          await this.handleSnipe(chatId, userId, text, bot);
          break;
        case '/status':
          await this.handleStatus(chatId, userId, bot);
          break;
        case '/settings':
          await this.handleSettings(chatId, userId, bot);
          break;
        case '/help':
          await this.handleHelp(chatId, bot);
          break;
        default:
          await bot.sendMessage(chatId, '❓ Unknown command. Type /help for available commands.');
      }
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  }

  async handleCallback(query: TelegramBot.CallbackQuery, bot: TelegramBot): Promise<void> {
    const chatId = query.message?.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (!chatId || !data) return;

    try {
      await bot.answerCallbackQuery(query.id);
      
      if (data === 'connect_new_wallet') {
        await this.handleConnectWallet(chatId, userId, bot);
      } else if (data === 'view_balance') {
        await this.handleBalance(chatId, userId, bot);
      } else if (data === 'view_settings') {
        await this.handleSettings(chatId, userId, bot);
      }
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  }

  private async handleStart(chatId: number, bot: TelegramBot): Promise<void> {
    const welcomeMessage = `
🎯 *Welcome to SniprX Bot!*

Your advanced Monad presale sniping companion with MEV protection.

*Features:*
• 🔐 Secure wallet connection
• ⚡ Lightning-fast presale sniping
• 🛡️ MEV protection & gas optimization
• 📊 Smart risk management
• 🎮 Degen-friendly interface

*Quick Start:*
1. Connect your wallet with /connectwallet
2. Set up your snipe with /snipe
3. Watch the magic happen! 🚀

Type /help for all commands.
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔐 Connect Wallet', callback_data: 'connect_new_wallet' },
          { text: '💰 View Balance', callback_data: 'view_balance' }
        ],
        [
          { text: '⚙️ Settings', callback_data: 'view_settings' },
          { text: '📊 Status', callback_data: 'view_status' }
        ]
      ]
    };

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleConnectWallet(chatId: number, userId: number, bot: TelegramBot): Promise<void> {
    try {
      const address = await this.walletManager.connectWallet(userId);
      const session = this.userSessions.get(userId);
      
      if (session) {
        session.walletConnected = true;
      }

      await bot.sendMessage(chatId, `
🔐 *Wallet Connected Successfully!*

📍 Address: \`${address}\`

⚠️ *Security Notice:*
• Your wallet is now connected to SniprX
• We never store your private keys
• Always verify transactions before signing

Ready to start sniping! 🎯
      `, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to connect wallet: ${error}`);
    }
  }

  private async handleBalance(chatId: number, userId: number, bot: TelegramBot): Promise<void> {
    try {
      if (!this.walletManager.isWalletConnected(userId)) {
        await bot.sendMessage(chatId, '❌ Please connect your wallet first with /connectwallet');
        return;
      }

      const balance = await this.walletManager.getBalance(userId);
      const address = this.walletManager.getWalletAddress(userId);

      await bot.sendMessage(chatId, `
💰 *Wallet Balance*

📍 Address: \`${address}\`
💎 Balance: *${balance} MON*

Ready for sniping! 🎯
      `, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to get balance: ${error}`);
    }
  }

  private async handleSnipe(chatId: number, userId: number, text: string, bot: TelegramBot): Promise<void> {
    const args = text.split(' ');
    if (args.length < 3) {
      await bot.sendMessage(chatId, `
🎯 *Snipe Command Usage:*

\`/snipe <contract_address> <amount_in_MON>\`

*Example:*
\`/snipe 0x1234...5678 1.5\`

This will snipe 1.5 MON worth of tokens when the contract launches.
      `, { parse_mode: 'Markdown' });
      return;
    }

    try {
      if (!this.walletManager.isWalletConnected(userId)) {
        await bot.sendMessage(chatId, '❌ Please connect your wallet first with /connectwallet');
        return;
      }

      const contractAddress = args[1];
      const amount = args[2];

      // Check risk limits
      const riskCheck = await this.riskManager.checkRiskLimits(userId, amount, '25');
      if (!riskCheck.allowed) {
        await bot.sendMessage(chatId, `❌ Risk limit exceeded: ${riskCheck.reason}`);
        return;
      }

      const snipeTarget = {
        contractAddress,
        tokenSymbol: 'UNKNOWN',
        launchTime: new Date(Date.now() + 60000), // 1 minute from now
        maxGasPrice: '50',
        slippage: 5,
        amount
      };

      const snipeId = await this.snipingEngine.scheduleSnipe(userId, snipeTarget);
      
      await bot.sendMessage(chatId, `
🎯 *Snipe Scheduled!*

📍 Contract: \`${contractAddress}\`
💰 Amount: *${amount} MON*
⏰ Launch: *1 minute*
🆔 Snipe ID: \`${snipeId}\`

🔥 Ready to hunt! The bot will execute automatically at launch.
      `, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to schedule snipe: ${error}`);
    }
  }

  private async handleStatus(chatId: number, userId: number, bot: TelegramBot): Promise<void> {
    const session = this.userSessions.get(userId);
    const metrics = this.riskManager.getUserMetrics(userId);
    const activeSnipes = this.snipingEngine.getActiveSnipes();

    const statusMessage = `
📊 *SniprX Status*

🔐 Wallet: ${session?.walletConnected ? '✅ Connected' : '❌ Not Connected'}
🎯 Active Snipes: *${activeSnipes.length}*
📈 Success Rate: *${metrics.successRate.toFixed(1)}%*
🔥 Daily Snipes: *${metrics.snipesCount}/${this.riskManager.getUserRiskSettings(userId).maxSnipesPerDay}*
📉 Daily Loss: *${metrics.dailyLoss.toFixed(1)}%*

${session?.cooldownUntil ? `⏳ Cooldown: ${Math.ceil((session.cooldownUntil.getTime() - Date.now()) / 1000)}s` : '🟢 Ready to snipe!'}
    `;

    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  }

  private async handleSettings(chatId: number, userId: number, bot: TelegramBot): Promise<void> {
    const settings = this.riskManager.getUserRiskSettings(userId);

    const settingsMessage = `
⚙️ *Risk Management Settings*

📉 Max Daily Loss: *${settings.maxDailyLoss}%*
🎯 Max Snipes/Day: *${settings.maxSnipesPerDay}*
⛽ Max Gas Price: *${settings.maxGasPrice} gwei*
🔄 Max Slippage: *${settings.maxSlippage}%*
⏱️ Cooldown: *${settings.cooldownPeriod / 1000}s*

Use /help for commands to modify these settings.
    `;

    await bot.sendMessage(chatId, settingsMessage, { parse_mode: 'Markdown' });
  }

  private async handleHelp(chatId: number, bot: TelegramBot): Promise<void> {
    const helpMessage = `
🎯 *SniprX Commands*

*Wallet Management:*
/connectwallet - Connect your wallet
/balance - Check wallet balance

*Sniping:*
/snipe <address> <amount> - Schedule a snipe
/status - View bot status

*Settings:*
/settings - View risk settings

*General:*
/start - Welcome message
/help - This help message

*Pro Tips:* 🔥
• Always test with small amounts first
• Monitor gas prices during high activity
• Set appropriate slippage for volatile tokens
• Use risk limits to protect your funds

Happy sniping! 🚀
    `;

    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }
}
