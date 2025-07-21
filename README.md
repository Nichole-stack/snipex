# 🎯 SniprX - Monad Presale Sniper Bot

Advanced Telegram bot for precision presale sniping on the Monad ecosystem with MEV protection and smart risk controls.

## Features

### 🔗 Wallet Integration
- Secure Monad wallet connection
- Transaction signing through Telegram
- Real-time balance monitoring
- Support for existing wallets via private key

### ⏱️ Smart Cooldowns & Risk Controls
- Custom cooldown timers between snipes
- Daily loss limits with auto-disable
- Maximum snipes per day/session limits
- Optional whitelist mode for verified projects
- Real-time alerts for risk thresholds

### 🛡️ MEV Protection
- Lightweight MEV engine with gas optimization
- Priority transaction placement using gas bumping
- Mint timing detection and frontrunning capabilities
- Sandwich attack protection with slippage controls
- Monad high-throughput exploitation

### 🎯 Presale Sniping Engine
- Track upcoming presale launches
- Monitor trending tokens and opportunities
- Auto-buy when mints go live
- Post-mint price performance monitoring
- Intelligent stop-loss mechanisms

## Commands

| Command | Description |
|---------|-------------|
| `/connectwallet` | Connect your Monad wallet |
| `/snipe <token>` | Start sniping a presale |
| `/cooldown <minutes>` | Set cooldown duration |
| `/setrisk <%>` | Set daily loss threshold |
| `/summary` | View stats, profit/loss, cooldown |
| `/stop` | Emergency kill switch |
| `/listings` | See trending or upcoming mints |
| `/help` | Get usage instructions |

## Setup

### 1. Create Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Save your bot token

### 2. Configure Environment
1. Copy `.env.example` to `.env`
2. Add your Telegram bot token
3. Configure Monad RPC settings
4. Add your wallet private key (optional)

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Bot
```bash
npm run start
```

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=41454
PRIVATE_KEY=your_private_key_here
MEV_API_KEY=your_mev_api_key_here
PORT=3000
```

## Architecture

### Core Services
- **WalletManager**: Handles wallet connections and transactions
- **MEVEngine**: Optimizes gas strategies and MEV protection
- **SnipingEngine**: Manages presale monitoring and execution
- **RiskManager**: Enforces cooldowns and loss limits
- **CommandHandler**: Processes Telegram commands and callbacks

### Security Features
- Private key encryption
- Transaction signing verification
- Rate limiting and cooldowns
- Loss limit enforcement
- Whitelist mode for verified projects

## Risk Management

### Daily Limits
- Configurable daily loss percentage (1-100%)
- Maximum snipes per day limit
- Auto-disable when limits reached
- Real-time loss tracking

### Cooldown System
- Custom cooldown periods (1-1440 minutes)
- Automatic cooldown after failed snipes
- Manual cooldown activation
- Cooldown status monitoring

## MEV Protection

### Gas Optimization
- Dynamic gas price calculation
- Priority fee optimization
- Base fee monitoring
- Urgency-based strategies

### Attack Prevention
- Sandwich attack detection
- Frontrunning protection
- Slippage tolerance controls
- Transaction deadline enforcement

## Development

### Build for Production
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

### Bot Development
```bash
npm run bot
```

## Disclaimer

⚠️ **Important**: This bot is designed for Monad testnet only. Cryptocurrency trading involves significant risk. Use at your own risk and never invest more than you can afford to lose.

## Support

For support and updates:
- Telegram: [@SniprXSupport](https://t.me/SniprXSupport)
- Documentation: [docs.sniprx.com](https://docs.sniprx.com)

## License

MIT License - see LICENSE file for details.
