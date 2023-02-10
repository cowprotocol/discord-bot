const { Client, Intents, DMChannel, MessageEmbed } = require('discord.js')
const cowsay = require('cowsay')
const dotenv = require('dotenv')

dotenv.config()

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
})

client.login(process.env.BOT_TOKEN)

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const noGmAllowed = /^(gn|gm)(\s+|$)/i
const noHello = /^(hi+|hey|hello|h?ola)!?\s*$/i
const secretChannel = /^!join$/
const noCommands = /^!/
const verifyCommand = /^!verify/
const noChannelTags = /^\s*\<#\d+\>\s*$/

// auto-replies
const whereToken = /.*where (to |.*)(claim|airdrop).*/i
const howToClaim = /.*(how) (.*)(claim|airdrop).*/i
const whenTrade = /.*(wh?en|how|where) .*(trade|exchange|swap|sell|listing).*/i
const isTradeable = /.*(is|can) (trade(able)?|list(ed)?).*/i
const wenVote = /.*(wh?en) .*(vote|voting).*/i
const sellToken = /.*(where|how|wh?en).*(sell).*/i
const tokenPrice = /.*(what)?.*(token)? price.*/i
const wenMoon = /.*(wh?en|where).*mo+n.*/i
const wenLambo = /.*(wh?en|where).*lambo.*/i
const wenNetwork = /.*wh?en\s+(poly|binance|bnb|arbi|avalanche).*/i
const meaningOfLife = /.*meaning of life.*/i
const contractAddress = /.*(contract|token) .*address.*/i
const totalSupply = /.*(total|max|maximum|token) supply.*/i
const addGChain = /.*add (gchain|gnosis ?chain|xdai)( to (mm|metamask|mmask|wallet))?.*/i
const howToSwap = /.*(how (to )?transfer|vCOW to COW|convert vCOW|swap vCOW).*/i

const wenMoonGifs = [
  'https://cdn.discordapp.com/attachments/941725405554024539/942843922483413042/ezgif.com-gif-maker_78.gif',
  'https://cdn.discordapp.com/attachments/869170255266734103/941755575073660959/44aafe91f10b22af690ccb7513d03779.gif',
  'https://c.tenor.com/YZWhYF-xV4kAAAAd/when-moon-admin.gif',
  'https://c.tenor.com/x-kqDAmw2NQAAAAC/parrot-party.gif',
  'https://cdn.discordapp.com/attachments/941725405554024539/941764782711767120/ezgif.com-gif-maker_72.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
]

const wenLamboGifs = [
  'https://c.tenor.com/5bScutaRZWgAAAAd/travolta-safemoon.gif',
  'https://c.tenor.com/_dae-kRV6jUAAAAS/lambo-cardboard.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
  'https://cdn.discordapp.com/attachments/941725405554024539/941768562509500446/ezgif.com-gif-maker_73.gif',
]

const meaningOfLifeGifs = [
  'https://pa1.narvii.com/6331/0e0ef4cfaf24742e0ca39e79a4df2a1aff6f928c_hq.gif',
  'https://i.giphy.com/media/dYgDRfc61SGtO/giphy.webp',
  'https://i.giphy.com/media/OY9XK7PbFqkNO/giphy.webp',
]

const dunnoGifs = [
  'https://i.giphy.com/media/Ll2fajzk9DgaY/giphy.webp',
  'https://media3.giphy.com/media/3ornjSL2sBcPflIDiU/giphy.gif?cid=790b7611a6dda9fdddbbdf71cdfa0e041f5b7ca24c516d90&rid=giphy.gif&ct=g',
  'https://i.giphy.com/media/y65VoOlimZaus/giphy.webp',
  'https://i.giphy.com/media/4HnRkHk77nStQSGxgi/giphy.webp',
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
const pickDunno = pickFromList(dunnoGifs)

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

const ADDRESSES_EMBEDDED_MSG = new MessageEmbed()
  .setTitle('CowDAO relevant addresses')
  .addField(
    'Ethereum',
    `
  - CowDAO Safe: [\`eth:0xcA771eda0c70aA7d053aB1B25004559B918FE662\`](https://gnosis-safe.io/app/eth:0xcA771eda0c70aA7d053aB1B25004559B918FE662)
  - COW Token: [\`0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB\`](https://etherscan.io/token/0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB)
  - vCOW: [\`0xD057B63f5E69CF1B929b356b579Cba08D7688048\`](https://etherscan.io/token/0xD057B63f5E69CF1B929b356b579Cba08D7688048)`,
  )
  .addField(
    'Gnosis Chain',
    `
  - CowDAO Safe:  [\`gno:0xcA771eda0c70aA7d053aB1B25004559B918FE662\`](https://gnosis-safe.io/app/gno:0xcA771eda0c70aA7d053aB1B25004559B918FE662)
  - COW Token: [\`0x177127622c4A00F3d409B75571e12cB3c8973d3c\`](https://blockscout.com/xdai/mainnet/token/0x177127622c4A00F3d409B75571e12cB3c8973d3c)
  - vCOW: [\`0xc20C9C13E853fc64d054b73fF21d3636B2d97eaB\`](https://blockscout.com/xdai/mainnet/token/0xc20C9C13E853fc64d054b73fF21d3636B2d97eaB)
  `,
  )

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) {
      console.log('Do not reply to bots', message.author.tag)
      return
    }
    if (message.type !== 'DEFAULT') {
      console.log('Can only interact with default messages', message.type)
      return
    }
    if (message.channel instanceof DMChannel) {
      message.reply(
        codeBlock(cowsay.say({ text: "I am a bot and can't reply, beep bop" })),
      )
      return
    }

    if (verifyCommand.test(message.content)) {
      await message.reply('You are close, buddy. Try `/verify` instead')
      await message.delete()
    } else if (noCommands.test(message.content)) {
      await message.reply(
        'Not a valid command. Maybe try `/verify` on #verify-here ?',
      )

      if (secretChannel.test(message.content)) {
        const dmChannel = await message.author.createDM()
        await dmChannel.send(
          codeBlock(cowsay.say({ text: 'There is no #cow-level 🤫', p: true })),
        )
      }
      await message.delete()
    } else if (noChannelTags.test(message.content)) {
      await message.reply('Please stop tagging channels with no reason')
      await message.delete()
    } else if (noGmAllowed.test(message.content)) {
      await message.reply(
        'Please mooooove your `gm` and `gn` to the #gm channel',
      )
      await message.delete()
    } else if (noHello.test(message.content)) {
      await message.reply(
        `${helloMsgReply(
          message.content,
        )} nice to see you too! Next time please move your \`hi\` messages to the #gm channel`,
      )
      await message.delete()
    } else if (wenMoon.test(message.content)) {
      await message.reply(pickMoon())
    } else if (wenLambo.test(message.content)) {
      await message.reply(pickLambo())
    } else if (meaningOfLife.test(message.content)) {
      await message.reply(pickMeaningOfLife())
    } else if (wenNetwork.test(message.content)) {
      await message.reply(pickDunno())
    } else if (wenVote.test(message.content)) {
      await message.reply(
        'Any active vote will be visible on the snapshot page https://snapshot.org/#/cow.eth. For current proposal in the discussion phase, check the forum (https://forum.cow.fi)',
      )
    } else if (contractAddress.test(message.content)) {
      await message.channel.send({ embeds: [ADDRESSES_EMBEDDED_MSG] })
    } else if (totalSupply.test(message.content)) {
      await message.reply(
        "vCOW's total supply is 1 Billion.\n\nKeep in mind not everything will be in circulation because most will have a 4 year vesting period. For more info, check https://forum.gnosis.io/t/gip-13-phase-2-cowdao-and-cow-token/2735",
      )
    } else if (addGChain.test(message.content)) {
      await message.reply(
        'To add Gnosis Chain to your wallet:\n1. go to https://chainlist.org/\n2. Search for Gnosis Chain\n3. Connect your wallet\n4. Click on "Add to Metamask"',
      )
    } else if (howToSwap.test(message.content)) {
      await message.reply(
        "Go to https://swap.cow.fi/#/profile and click on `Convert to COW`.\nKeep in mind you'll only see the button if you have vested vCOW tokens.",
      )
    }
  } catch (e) {
    console.error('Something failed handling a message', e)
  }
})
