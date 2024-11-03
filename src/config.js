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

  // Excluded Channels (Add channel IDs to exclude) from message detection
  EXCLUDED_CHANNELS: [
    process.env.SUPPORT_TICKET_CHANNEL_ID
    // Add more channel IDs as needed
  ].filter(Boolean), // This removes any undefined or null values

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
};

