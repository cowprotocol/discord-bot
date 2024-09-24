

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { checkTransfers } = require('./transactionMonitor');
const config = require('./config');
const { handleMessage } = require('./messageHandlers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  setInterval(() => checkTransfers(client), config.POLL_INTERVAL);
});

client.on('messageCreate', handleMessage);

client.login(process.env.BOT_TOKEN).catch(err => {
  console.error('Failed to login:', err);
});