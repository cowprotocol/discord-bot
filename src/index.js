const { Client, GatewayIntentBits , DMChannel, EmbedBuilder, MessageType  } = require('discord.js');
const cowsay = require('cowsay');
const dotenv = require('dotenv');
const axios = require('axios');
const { Web3,AbiError } = require('web3');
const POLL_INTERVAL =  120000; // Poll every 120 seconds

dotenv.config()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
});

const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;
const WEB3_PROVIDER = 'https://arb1.arbitrum.io/rpc'; // Arbitrum RPC URL
const TOKEN_ADDRESS = '0x86f65121804D2Cdbef79F9f072D4e0c2eEbABC08';
const STAKING_CONTRACT_ADDRESS = '0xe2239938ce088148b3ab398b2b77eedfcd9d1afc';
const UNISWAP_POOL_ADDRESS = '0xf9f588394ec5c3b05511368ce016de5fd3812446';
const UNISWAP_POOL_ABI = [
  {
      "inputs": [],
      "name": "token0",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
  }
];
const LARGE_SWAP_AMOUNT = 50000
const LARGE_STAKE_AMOUNT = 21000
const web3 = new Web3(WEB3_PROVIDER);

const ENVIRONMENT = process.env.ENVIRONMENT;
const CHANNEL_ID = ENVIRONMENT === 'production' ? process.env.PROD_CHANNEL_ID : process.env.TEST_CHANNEL_ID;

//highest block we've checked so far
let highestCheckedBlock = 0; 
//Set to store processed transaction hashes
const processedTransactions = new Set();

client.login(process.env.BOT_TOKEN).catch(err => {
  console.error('Failed to login:', err);
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
    setInterval(checkTransfers, POLL_INTERVAL);
});

async function checkTransfers() {
  const currentBlock = await getLatestBlockNumber();
  if (highestCheckedBlock === 0) {
      highestCheckedBlock = currentBlock - 1; // Set to the latest block on the first run
  }
  if (currentBlock <= highestCheckedBlock) {
      return;        
  }
  const transfers = await getTokenTransfers(highestCheckedBlock, currentBlock);
  highestCheckedBlock = currentBlock;
  //Check if any transfer meets the threshold
  const hasLargeTransfer = transfers.some(transfer => 
    Number(transfer.value) >= LARGE_STAKE_AMOUNT
  );

  let tokenPrice = null;
  if (hasLargeTransfer) {
    tokenPrice = await getTokenPrice();  
  }
  for (const transfer of transfers) {
    const amount = parseFloat(transfer.value) / 1e18;
    const usdValue = tokenPrice !== null ? amount * tokenPrice : 0;
    const txHash = transfer.hash;
    const displayText = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;

    if (processedTransactions.has(txHash)) {
      //Skip if the transaction has already been processed
      console.log(`Transaction ${txHash} has already been processed.`);
      return;
    }
    //Add the transaction hash to the set of processed transactions
    processedTransactions.add(txHash);   

    
    if (transfer.to.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase() && amount >= LARGE_STAKE_AMOUNT) {
      sendAlert(new EmbedBuilder()
        .setTitle('🌸 Large SEED 🌱 Stake 🌸')
        .addFields([
            { name: 'SEED 🌱 Staked', value: amount.toString() },
            { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
            { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
        ]), CHANNEL_ID);
    } else if (amount >= LARGE_SWAP_AMOUNT) { // update this to like 50k after testing
        const receipt = await getTransactionReceipt(transfer.hash);
        const isSwap = receipt.logs.some(log => log.address.toLowerCase() === UNISWAP_POOL_ADDRESS.toLowerCase() && log.topics[0] === web3.utils.sha3('Swap(address,address,int256,int256,uint160,uint128,int24)'));

        if (isSwap) {
            const swapDetails = receipt.logs.find(log => log.address.toLowerCase() === UNISWAP_POOL_ADDRESS.toLowerCase());
            console.log('Raw swapDetails data:', swapDetails);

            // Ensure the swapDetails data and topics are valid
            if (swapDetails && swapDetails.data && swapDetails.topics.length > 1) {
                console.log('swapDetails.address:', swapDetails.address);
                console.log('swapDetails.topics:', swapDetails.topics);
                console.log('swapDetails.data:', swapDetails.data);

                try {
                    // Check data length
                    if (swapDetails.data.length < 320) {
                        throw new Error('Log data is shorter than expected for a Swap event');
                    }

                    // Decode each field manually using BigInt where necessary
                    const amount0 = BigInt('0x' + swapDetails.data.slice(2, 66));
                    const amount1 = BigInt('0x' + swapDetails.data.slice(66, 130));
                    const sqrtPriceX96 = BigInt('0x' + swapDetails.data.slice(130, 194));
                    const liquidity = BigInt('0x' + swapDetails.data.slice(194, 258));
                    const tick = parseInt('0x' + swapDetails.data.slice(258, 290), 16);

                    const swapEvent = {
                        sender: swapDetails.topics[1],
                        recipient: swapDetails.topics[2],
                        amount0,
                        amount1,
                        sqrtPriceX96,
                        liquidity,
                        tick
                    };

                    console.log('Decoded swapEvent:', swapEvent);

                    // Determine which token is being bought
                    const token0 = await getToken0Address(UNISWAP_POOL_ADDRESS);
                    const isSeedBuy = (token0.toLowerCase() === TOKEN_ADDRESS.toLowerCase()) ? 
                        (swapEvent.amount0 > 0n) : (swapEvent.amount1 > 0n);

                    if (isSeedBuy) {
                        sendAlert(new EmbedBuilder()
                            .setTitle('🌸 Large SEED 🌱 Swap 🌸')
                            .addFields([
                                { name: 'SEED 🌱 Bought', value: amount.toString() },
                                { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
                                { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
                            ])
                        , CHANNEL_ID);
                    }
                } catch (error) {
                    if (error instanceof AbiError) {
                        console.error('Error decoding log:', error);
                        // Handle the error or skip the log
                    } else {
                        console.error('Unexpected error:', error);
                        throw error;
                    }
                }
            } else {
                console.error('Invalid swapDetails data or topics:', swapDetails);
            }
        } else {
            sendAlert(new EmbedBuilder()
                .setTitle('🌸 Large SEED 🌱 Transfer 🌸')
                .addFields([
                    { name: 'SEED 🌱 Transferred', value: amount.toString() },
                    { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
                    { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
                ])
            , CHANNEL_ID);
        }
      }
  }
}

async function getLatestBlockNumber() {
  const response = await axios.get(`https://api.arbiscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ARBISCAN_API_KEY}`);
  return parseInt(response.data.result, 16);
}

async function getTokenTransfers(startBlock, endBlock) {
  const response = await axios.get(`https://api.arbiscan.io/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${ARBISCAN_API_KEY}`);
  return response.data.result;
}

async function getTransactionReceipt(txHash) {
  return await web3.eth.getTransactionReceipt(txHash);
}
async function getToken0Address(poolAddress) {
  const poolContract = new web3.eth.Contract(UNISWAP_POOL_ABI, poolAddress);
  return await poolContract.methods.token0().call();
}
async function getTokenPrice() {
  // This is a placeholder. You'd need to replace this with an actual API call to a price feed
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=garden-2&vs_currencies=usd');
  return response.data['garden-2'].usd;
}

/* Related to detecting and responding to discord messages */

const noGmAllowed = /^(gn|gm)(\s+|$)/i
const noHello = /^(hi+|hey|hello|h?ola)!?\s*$/i
const secretChannel = /^!join$/
const noCommands = /^!/
const noChannelTags = /^\s*\<#\d+\>\s*$/

// Regex patterns for detecting spam
const userDisplayName = /announcement/i;
const scamPatterns = [
  /airdrop is live now/i,
  /collaborated with opensea/i,
  /claim as soon as possible/i,
  /this is an automatically generated announcement message/i,
  /earn \$?\d+k or more within \d+ hours/i,
  /you will pay me \d+% of your profit/i,
  /(only interested people should apply|drop a message|let's get started by asking)/i,
  /WhatsApp \+\d{1,3} \d{4,}/i,
  /how to earn|how to make money|make \$\d+k/i,
  /I\u2019ll teach \d+ people to earn/i,
];

// auto-replies
const urlPattern = /https?:\/\/[^\s]+/i;
const howToClaim = /.*(how) (.*)(claim|airdrop).*/i
const wenDefillama = /.*(wh?en) .*(defillama|llama).*/i
const wenVote = /.*(wh?en) .*(vote|voting).*/i
const wenMoon = /.*(wh?en|where).*mo+n.*/i
const wenLambo = /.*(wh?en|where).*lambo.*/i
const wenNetwork = /.*wh?en\s+(optimism|op|binance|bnb|gnosis|avax|avalanche|base).*/i
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
        - Garden Pass: [\`0x1ab59ae8bb54700b3c2c2cec4db2da26fe825a7d\`](https://arbiscan.io/address/0x1ab59ae8bb54700b3c2c2cec4db2da26fe825a7d)`
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

    await handleScamMessage(message);

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

// Function to check for and handle scam messages
async function handleScamMessage(message) {
  const isScamUser = userDisplayName.test(message.member.displayName);
  const isScamContent = scamPatterns.some(pattern => pattern.test(message.content));
  const hasMentions = message.mentions.everyone;
  const hasExternalUrl = urlPattern.test(message.content);

  if (isScamContent) {
    try {
      await message.delete();
      console.log(`Deleted scam message from ${message.author.tag}. `);

      const joinDate = message.member.joinedAt.toDateString();
      const displayName = message.member.displayName;
      const username = message.author.username;
      const userId = message.author.id;
      const accountCreatedAt = message.author.createdAt.toDateString();
      const roles = message.member.roles.cache
        .filter(role => role.name !== '@everyone')
        .map(role => role.name)
        .join(', ');
      const originalMessage = message.content.trim();
  
      // Create an embed with the provided information
      const warningMessageEmbed = new EmbedBuilder ()
          .setTitle('🚨 Potential scam/spam detected')
          .setDescription(`Planting a 🌱 instead.`)
          .addFields(
              { name: 'Account Created', value: accountCreatedAt, inline: true },
              { name: 'Joined Garden Discord', value: joinDate, inline: true },
              { name: 'Display Name', value: displayName, inline: true },
              { name: 'Username', value: `[${username}](https://discord.com/users/${userId})`, inline: true },
              { name: 'Roles', value: roles, inline: true },
              { name: 'Original Message (click to expand)', value: `||${originalMessage}||` }
          )
          .setColor('#FF0000'); // Set the color of the embed
  
      // Send the embed message to the same channel
      await message.channel.send({
          embeds: [warningMessageEmbed],
          allowedMentions: { parse: [] }  // Disallow mentions so we don't spam people
      });
    } catch (error) {
      console.error('Failed to delete message or send warning:', error);
    }
  }
}

// Helper functions 

//to format numbers with commas
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

//Send and embedded message to a specific channel
function sendAlert(embeddedMessage,channelId) {
  const channel = client.channels.cache.get(channelId);
  if (channel) {
      channel.send({ embeds: [embeddedMessage] })
  }
}
