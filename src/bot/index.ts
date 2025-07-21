import TelegramBot from 'node-telegram-bot-api';
import { WalletManager } from './services/WalletManager';
import { MEVEngine } from './services/MEVEngine';
import { SnipingEngine } from './services/SnipingEngine';
import { RiskManager } from './services/RiskManager';
import { CommandHandler } from './handlers/CommandHandler';
import { UserSession } from './types/UserSession';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SniprXBot {
  private bot: TelegramBot;
  private walletManager: WalletManager;
  private mevEngine: MEVEngine;
  private snipingEngine: SnipingEngine;
  private riskManager: RiskManager;
  private commandHandler: CommandHandler;
  private userSessions: Map<number, UserSession> = new Map();

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.walletManager = new WalletManager();
    this.mevEngine = new MEVEngine();
    this.riskManager = new RiskManager();
    this.snipingEngine = new SnipingEngine(this.walletManager, this.mevEngine);
    this.commandHandler = new CommandHandler(
      this.walletManager,
      this.snipingEngine,
      this.riskManager,
      this.userSessions
    );

    this.setupEventHandlers();
    this.startMEVMonitoring();
  }

  private setupEventHandlers(): void {
    // Handle text messages
    this.bot.on('message', async (msg) => {
      const userId = msg.from?.id;
      if (!userId) return;

      // Create user session if doesn't exist
      if (!this.userSessions.has(userId)) {
        this.createUserSession(userId, msg.chat.id);
      }

      // Update last activity
      const session = this.userSessions.get(userId);
      if (session) {
        session.lastActivity = new Date();
      }

      // Handle commands
      if (msg.text?.startsWith('/')) {
        await this.commandHandler.handleCommand(msg, this.bot);
      }
    });

    // Handle callback queries (inline buttons)
    this.bot.on('callback_query', async (query) => {
      await this.commandHandler.handleCallback(query, this.bot);
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  private createUserSession(userId: number, chatId: number): void {
    const session: UserSession = {
      userId,
      chatId,
      walletConnected: false,
      cooldownUntil: null,
      dailyLossLimit: 20,
      dailyLosses: 0,
      snipesCount: 0,
      maxSnipesPerDay: 10,
      whitelistMode: false,
      activeSnipes: new Set(),
      lastActivity: new Date()
    };

    this.userSessions.set(userId, session);
  }

  private async startMEVMonitoring(): Promise<void> {
    try {
      await this.mevEngine.startMonitoring();
      console.log('🔍 MEV monitoring started successfully');
    } catch (error) {
      console.error('Failed to start MEV monitoring:', error);
    }
  }

  public start(): void {
    console.log('🚀 SniprX Bot started successfully!');
    console.log('🎯 Ready to snipe on Monad testnet');
    console.log('🛡️ MEV protection enabled');
    console.log('📊 Risk management active');
  }

  public stop(): void {
    this.mevEngine.stopMonitoring();
    this.bot.stopPolling();
    console.log('⏹️ SniprX Bot stopped');
  }
}

// Start the bot
const bot = new SniprXBot();
bot.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SniprX Bot...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down SniprX Bot...');
  bot.stop();
  process.exit(0);
});
