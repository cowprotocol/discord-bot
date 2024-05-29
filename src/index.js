const { Client, GatewayIntentBits , DMChannel, EmbedBuilder, MessageType  } = require('discord.js')
const cowsay = require('cowsay')
const dotenv = require('dotenv')

dotenv.config()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
})

client.login(process.env.BOT_TOKEN)

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.channel.send('Pong!');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
  console.error('Failed to login:', err);
});

const noGmAllowed = /^(gn|gm)(\s+|$)/i
const noHello = /^(hi+|hey|hello|h?ola)!?\s*$/i
const secretChannel = /^!join$/
const noCommands = /^!/
const noChannelTags = /^\s*\<#\d+\>\s*$/

// auto-replies
const howToClaim = /.*(how) (.*)(claim|airdrop).*/i
const wenDefillama = /.*(wh?en) .*(defillama|llama).*/i
const wenVote = /.*(wh?en) .*(vote|voting).*/i
const wenMoon = /.*(wh?en|where).*mo+n.*/i
const wenLambo = /.*(wh?en|where).*lambo.*/i
const wenNetwork = /.*wh?en\s+(optimism|op|binance|bnb|gnosis|avax|avalanche).*/i
const meaningOfLife = /.*meaning of life.*/i
const contractAddress = /.*(contract|token) .*address.*/i
const totalSupply = /.*(total|max|maximum|token|seed) supply.*/i
const howToSwap = /.*(how (to )?swap|WBTC to BTC|BTC to WBTC).*/i
const wenDuneAnalytics = /.*(wh?en|where).*(dune|analytics).*/i
const wenDude = /.*(wh?en|where).*(dude).*/i
const wenStake = /.*(wh?en) .*(stake|staking).*/i
const stakingIssues = /.*(stake|staking).* (reward|received|not working|error|issue|problem).*/i;
const swapIssues = /.*(swap|swapping|exchange|convert|converting).* (no prompt|can't connect|trouble|not working|error|issue|problem).*/i;
const claimingIssues = /.*(claim|claiming).* (not work|error|issue|problem|how to).*/i;
const transactionIssues = /.*(transaction|refund|sent|transfer|overpaid|extra amount).* (issue|problem|error|how|when).*/i;

const wenMoonGifs = [
  'https://c.tenor.com/YZWhYF-xV4kAAAAd/when-moon-admin.gif',
  'https://c.tenor.com/x-kqDAmw2NQAAAAC/parrot-party.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
  'https://media1.tenor.com/m/9idtwWwfCdAAAAAC/wen-when.gif',
  'https://media1.tenor.com/m/LZZfKVHwpoIAAAAC/waiting-penguin.gif',
  'https://media1.tenor.com/m/1vXRFJxqIVgAAAAC/waiting-waiting-patiently.gif',
  'https://media1.tenor.com/m/XIr-1aBPoCEAAAAC/walk-hard-the-dewey-cox-story.gif'
]

const wenLamboGifs = [
  'https://c.tenor.com/_dae-kRV6jUAAAAS/lambo-cardboard.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
]

const meaningOfLifeGifs = [
  'https://pa1.narvii.com/6331/0e0ef4cfaf24742e0ca39e79a4df2a1aff6f928c_hq.gif',
  'https://i.giphy.com/media/dYgDRfc61SGtO/giphy.webp',
  'https://i.giphy.com/media/OY9XK7PbFqkNO/giphy.webp',
  'https://media1.tenor.com/m/Qc-OTTAsDnAAAAAd/best-field-day-ever.gif'
]

const dunnoGifs = [
  'https://i.giphy.com/media/Ll2fajzk9DgaY/giphy.webp',
  'https://media3.giphy.com/media/3ornjSL2sBcPflIDiU/giphy.gif?cid=790b7611a6dda9fdddbbdf71cdfa0e041f5b7ca24c516d90&rid=giphy.gif&ct=g',
  'https://i.giphy.com/media/y65VoOlimZaus/giphy.webp',
  'https://i.giphy.com/media/4HnRkHk77nStQSGxgi/giphy.webp',
]

const workingOnItGifs = [
  'Soon™\nhttps://media1.tenor.com/m/RXGEDEM_odoAAAAC/burstofenergy.gif',
  'Soon™\nhttps://media1.tenor.com/m/GS--K_H775kAAAAC/gardener-expert.gif',
  'Soon™\nhttps://media1.tenor.com/m/OiuNG8MQKkYAAAAC/nature-flower.gif',
  'Soon™\nhttps://media1.tenor.com/m/W42sxw9yTZkAAAAC/ponste9.gif',
  'Soon™\nhttps://media1.tenor.com/m/1ZPySWYcQkAAAAAC/cem-gif.gif',
  'Soon™\nhttps://media1.tenor.com/m/vo2C5ig9SIMAAAAd/erkenci-kus-sanem.gif',
  'Soon™\nhttps://media1.tenor.com/m/CmogjUfSyckAAAAd/aum-animation-andy-pirki.gif'
]

const wenDudeGifs = [
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGl6NTdwemdzNDM0eDVha3I1eXFraWU2ZXVreXQ1MmJlY2Q3MHc0ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/J6JDizWgG3bX704JEU/giphy.webphttps://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZnaWkyOTQ2aDE3ZWgzejB1bnFhM3JrZGFxdWZtNXpwbmljbDljaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lnDvZtsnWfnnX4T0KA/giphy-downsized-large.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGl6NTdwemdzNDM0eDVha3I1eXFraWU2ZXVreXQ1MmJlY2Q3MHc0ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/J6JDizWgG3bX704JEU/giphy-downsized-large.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWdpZ3U3b3pzb3RmOHB4cHpkZ2s0NDczYXdzbmZ5NGpyMmt1bjRjaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bueYrEU0GcwzTKo/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTR1ZDk2ZGRjNWhidzl2djUxM3U1bG9pODV4NDhsNHFhNXVraTR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hzrvwvnbgIV6E/giphy.gif',
]

function pickFromList(list) {
  let count = -1
  return () => {
    count += 1
    if (count > list.length - 1) {
      count = 0
    }
    return list[count]
  }
}

const pickMoon = pickFromList(wenMoonGifs)
const pickLambo = pickFromList(wenLamboGifs)
const pickMeaningOfLife = pickFromList(meaningOfLifeGifs)
const pickWorkingOnIt = pickFromList(workingOnItGifs)
const pickDude = pickFromList(wenDudeGifs)

function codeBlock(message) {
  return '```' + message + '```'
}

function helloMsgReply(msg) {
  if (msg.length < 2) {
    return 'Hi'
  }
  const normalized = msg.replace(/\s+/g, ' ').toLowerCase()
  return `${normalized[0].toUpperCase()}${normalized.substring(1)}`
}

const ADDRESSES_EMBEDDED_MSG = new EmbedBuilder ()
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
      `
    }
  );

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) {
      console.log('Do not reply to bots', message.author.tag)
      return
    }
    console.log(message.type);
    if (message.type !== MessageType.Default) {
      console.log('Can only interact with default messages', message.type)
      return
    }
    if (message.channel instanceof DMChannel) {
      message.reply(
        codeBlock(cowsay.say({ text: "I am a bot and can't reply, beep bop" })),
      )
      return
    }

    if (noCommands.test(message.content)) {
      await message.reply(
        'Not a valid command. I might work on that area of the garden later!',
      )

      if (secretChannel.test(message.content)) {
        const dmChannel = await message.author.createDM()
        await dmChannel.send(
          codeBlock(cowsay.say({ text: 'There is no #garden-level 🤫', p: true })),
        )
      }
      await message.delete()
    } else if (noChannelTags.test(message.content)) {
      await message.reply('Please stop tagging channels with no reason')
      await message.delete()
    } else if (noGmAllowed.test(message.content) && message.channel.name !== 'gm') {
      await message.reply(
        'Please plant🌱 your `gm` and `gn` to the #gm channel',
      )
      await message.delete()
    } else if (noHello.test(message.content) && message.channel.name !== 'gm') {
      await message.reply(
        `${helloMsgReply(
          message.content,
        )} nice to see you fellow Gardener! Next time please plant 🌱 your \`hi\` messages to the #gm channel`,
      )
      await message.delete()
    } else if (wenMoon.test(message.content)) {
      await message.reply(pickMoon())
    } else if (wenLambo.test(message.content)) {
      await message.reply(pickLambo())
    } else if (meaningOfLife.test(message.content)) {
      await message.reply(pickMeaningOfLife())
    } else if (wenNetwork.test(message.content)) {
      await message.reply(pickWorkingOnIt())
    } else if (wenDuneAnalytics.test(message.content)) {
      await message.reply(
        "Check out the official dune dashboard 📊 here: <https://dune.com/garden_finance/gardenfinance>"
      )
    } 
    else if (wenDude.test(message.content)) {
      await message.reply(pickDude())
    }
    else if (wenStake.test(message.content)) {
      await message.reply(
        'SEED Staking is live🌺 at <https://garden.finance/stake/>!\n\nYou can stake in increments of 2,100 SEED for 6 month, 12 month, 24 months, 48 months or permanently.\nYou can also burn 21,000 SEED for an Gardener Pass NFT for maximum voting power.\n\n For more info, and to start staking, visit <https://garden.finance/stake/>.'
      )
    } else if (wenVote.test(message.content)) {
      await message.reply(
        'SEED Stakers will eventually be able to vote on their favorite fillers. For more details, check out <https://garden.finance/blogs/market-making-and-staking/>',
      )
    } else if (contractAddress.test(message.content)) {
      await message.channel.send({ embeds: [ADDRESSES_EMBEDDED_MSG] })
    } else if (totalSupply.test(message.content)) {
      await message.reply(
        "SEED's total supply is 147,000,000.\n\nKeep in mind not everything will be in circulation at launch. For more info, check <https://garden.finance/blogs/wbtc-garden-introducing-seed/>",
      )
    } else if (howToSwap.test(message.content)) {
      await message.reply(
        "Go to <https://garden.finance/swap/> and swap today!\n\nFor more details on how to swap, check out this tutorial video\n <https://www.youtube.com/watch?v=YUaG1vo60L0>",
      )
    } else if (howToClaim.test(message.content)) {
      await message.reply(
        "To claim staked SEED 🌱 rewards visit <https://garden.finance/stake/>\n\nTo claim SEED 🌱 S2 rewards, check out <https://garden.finance/leaderboard>",
      )
    } else if (wenDefillama.test(message.content)) {
      await message.reply(
        "We are 🌸live🌸 on defillama, check it out!\n<https://defillama.com/protocol/garden>",
      )
    } else if (stakingIssues.test(message.content)) { // Staking Issues
    await message.reply("If you are having issues with staking, please open a support ticket in <https://discord.com/channels/1230012545155338281/1230384166278008932>");
    }

    // Swap Issues
    else if (swapIssues.test(message.content)) {
      await message.reply("If you're experiencing issues with an in progress swap, please open a support ticket in <https://discord.com/channels/1230012545155338281/1230384166278008932> and include your order ID");
    }

    // Claiming Issues
    else if (claimingIssues.test(message.content)) {
      await message.reply("If you are having issues claiming $SEED, please open a support ticket in <https://discord.com/channels/1230012545155338281/1230384166278008932>.");
    }

    // Transaction and Refund Issues
    else if (transactionIssues.test(message.content)) {
      await message.reply("If you have questions about a transaction or need help with a refund, please provide your order ID and open a support ticket in <https://discord.com/channels/1230012545155338281/1230384166278008932>");
    }
  } catch (e) {
    console.error('Something failed handling a message', e)
  }
})
