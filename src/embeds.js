const { EmbedBuilder } = require('discord.js');

const ADDRESSES_EMBEDDED_MSG = new EmbedBuilder()
  .setTitle('Garden Finance 🌱🌸 relevant addresses')
  .addFields(
    { 
      name: 'Ethereum',
      value: `
        - SEED Token: [\`0x5eed99d066a8CaF10f3E4327c1b3D8b673485eED\`](https://etherscan.io/address/0x5eed99d066a8caf10f3e4327c1b3d8b673485eed)
        - Garden Multisig [\`0x8686368A0DBdCB036c6Bd41381Beb96Da5bbA743\`](https://etherscan.io/address/0x8686368A0DBdCB036c6Bd41381Beb96Da5bbA743)`
    },
    { 
      name: 'Arbitrum',
      value: `
        - SEED Token: [\`0x86f65121804D2Cdbef79F9f072D4e0c2eEbABC08\`](https://arbiscan.io/token/0x86f65121804d2cdbef79f9f072d4e0c2eebabc08)
        - SEED Staking: [\`0xe2239938ce088148b3ab398b2b77eedfcd9d1afc\`](https://arbiscan.io/address/0xe2239938ce088148b3ab398b2b77eedfcd9d1afc)
        - Garden Pass: [\`0x1ab59ae8bb54700b3c2c2cec4db2da26fe825a7d\`](https://arbiscan.io/address/0x1ab59ae8bb54700b3c2c2cec4db2da26fe825a7d)`
    }
  );

function createTransferEmbed(amount, usdValue, txHash) {
  return new EmbedBuilder()
    .setTitle('🌸 Large SEED 🌱 Transfer 🌸')
    .addFields([
      { name: 'SEED 🌱 Transferred', value: amount.toString() },
      { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
      { name: 'Tx Hash', value: `[${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}](https://arbiscan.io/tx/${txHash})` }
    ]);
}

function createStakeEmbed(amount, usdValue, txHash) {
  return new EmbedBuilder()
    .setTitle('🌸 Large SEED 🌱 Stake 🌸')
    .addFields([
      { name: 'SEED 🌱 Staked', value: amount.toString() },
      { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
      { name: 'Tx Hash', value: `[${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}](https://arbiscan.io/tx/${txHash})` }
    ]);
}

function createSwapEmbed(amount, usdValue, txHash) {
  return new EmbedBuilder()
    .setTitle('🌸 Large SEED 🌱 Swap 🌸')
    .addFields([
      { name: 'SEED 🌱 Bought', value: amount.toString() },
      { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
      { name: 'Tx Hash', value: `[${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}](https://arbiscan.io/tx/${txHash})` }
    ]);
}

function createWarningMessageEmbed(accountCreatedAt, joinDate, displayName, username, userId, roles, channelIds, originalMessage) {
  return new EmbedBuilder()
    .setTitle('🚨 Suspicious Activity Detected')
    .setDescription(`Planting a 🌱 instead.`)
    .addFields(
      { name: 'Account Created', value: accountCreatedAt, inline: true },
      { name: 'Joined Server', value: joinDate, inline: true },
      { name: 'Display Name', value: displayName, inline: true },
      { name: 'Username', value: `[${username}](https://discord.com/users/${userId})`, inline: true },
      { name: 'Roles', value: roles || 'None', inline: true },
      { name: 'Spam Occurrences', value: channelIds.size.toString(), inline: true },
      { name: 'Removed Message (click to expand)', value: `||${originalMessage}||` }
    )
    .setColor('#FF0000');
}

module.exports = {
  ADDRESSES_EMBEDDED_MSG,
  createTransferEmbed,
  createStakeEmbed,
  createSwapEmbed,
  createWarningMessageEmbed
};