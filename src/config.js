require('dotenv').config();

module.exports = {
  // Discord Bot Configuration
  BOT_TOKEN: process.env.BOT_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,

  // Channel IDs
  SCAM_CHANNEL_ID: process.env.SCAM_CHANNEL_ID,
  GM_CHANNEL_ID: process.env.GM_CHANNEL_ID,
  SUPPORT_CHANNEL_ID: process.env.SUPPORT_TICKET_CHANNEL_ID,
  CHANNEL_ID: process.env.BOT_CHANNEL_ID,

  // Role IDs
  BASE_ROLE_ID: process.env.BASE_ROLE_ID,

  // Blockchain Configuration
  ARBISCAN_API_KEY: process.env.ARBISCAN_API_KEY,
  WEB3_PROVIDER: process.env.WEB3_PROVIDER || 'https://arb1.arbitrum.io/rpc',
  TOKEN_ADDRESS: '0x86f65121804D2Cdbef79F9f072D4e0c2eEbABC08', //SEED
  STAKING_CONTRACT_ADDRESS: '0xe2239938ce088148b3ab398b2b77eedfcd9d1afc',
  UNISWAP_POOL_ADDRESS: '0xf9f588394ec5c3b05511368ce016de5fd3812446',

  // Bot Behavior Configuration
  POLL_INTERVAL: 120000, // Poll every 120 seconds
  LARGE_SWAP_AMOUNT: 10000,
  LARGE_STAKE_AMOUNT: 20999,

  // Uniswap Pool ABI
  UNISWAP_POOL_ABI: [
    {
      "inputs": [],
      "name": "token0",                          
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ],

  // Garden System Configuration
  GARDEN_DB_PATH: process.env.GARDEN_DB_PATH || './garden.db',
  MAX_GARDEN_SIZE: 50,
  WEATHER_CHANGE_INTERVAL: 86400000, // 24 hours in milliseconds

  // Weather Types
  WEATHER_TYPES: ['☀️', '🌧️', '🌪️', '⛈️', '🌫️', '🌈'],

  // In config.js, add these lines:
  TARGET_TWITTER_ACCOUNTS: ['garden_finance', 'jzgulati', 'sivakoushik'], // Twitter IDs of accounts to track
  SEEDLINGS_PER_ENGAGEMENT: 1, // Number of seedlings awarded per engagement
};

