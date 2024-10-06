const { DMChannel, MessageType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle,ActionRowBuilder  } = require('discord.js');
const cowsay = require('cowsay');
const { 
  GM_CHANNEL_ID, SUPPORT_CHANNEL_ID, SCAM_CHANNEL_ID, BASE_ROLE_ID, CHANNEL_ID 
} = require('./config');
const { codeBlock, helloMsgReply, pickFromList, formatDuration } = require('./utils');
const { 
  ADDRESSES_EMBEDDED_MSG, 
  createWarningMessageEmbed, 
  createCommunityStatsEmbed, 
  createLeaderboardEmbed 
} = require('./embeds');

const suspectedScammers = new Map();
const SCAMMER_TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_MENTIONS = 4; // Maximum number of mentions allowed before action is taken
const MENTION_COOLDOWN = 10 * 60 * 1000; // 10 minutes cooldown for mention count
const MAX_SPAM_OCCURRENCES = 7; // Maximum number of spam occurrences before taking action

const suspiciousUserThreads = new Map();

// Regex patterns
const noGmAllowed = /^\s*(gn|gm)\s*$/i;
const noHello = /^(hi+|hey|hello|h?ola)!?\s*$/i;
const secretChannel = /^!join$/;

const userDisplayName = [
  /announcement/i,
  /📢/,
  /^PENDLE$/i,
];

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
  /server representative/i,
  /support representative/i,
  /JUICE AIR-DROP/i,
  /live NOW/i,
  /juice-foundation.org/i,
  /Get your free tokens/i
];

const urlPattern = /https?:\/\/[^\s]+/i;
const internalUrl = /(?<!https?:\/\/)(?:www\.)?(discord\.(?:com|gg)|discord(?:app)?\.com)(\S*)/i;
const howToClaim = /.*(how) (.*)(claim|airdrop).*/i;
const wenDefillama = /.*(wh?en) .*(defillama|llama).*/i;
const wenVote = /.*(wh?en) .*(vote|voting).*/i;
const wenMoon = /.*(wh?en|where).*mo+n.*/i;
const wenLambo = /.*(wh?en|where).*lambo.*/i;
const wenNetwork = /.*wh?en\s+(optimism|op|binance|bnb|gnosis|avax|avalanche|base|sol|solana|monad).*/i;
const meaningOfLife = /.*meaning of life.*/i;
const contractAddress = /.*(contract|token) .*address.*/i;
const totalSupply = /.*(total|max|maximum|token|seed) supply.*/i;
const wenDuneAnalytics = /.*(wh?en|where).*(dune|analytics).*/i;
const wenDude = /.*(wh?en|where).*(dude).*/i;
const wenStake = /.*(wh?en) .*(stake|staking).*/i;
const stakingIssues = /\b(stake|staking)\b.*\b(reward|received|error|issue|problem)\b(?!.*\b(how|what|when)\b)/i;
const swapIssues = /\b(swap|swapping|exchange|convert|converting)\b.*\b(no prompt|can't connect|trouble|error|issue|problem)\b(?!.*\b(how|what|when)\b)/i;
const claimingIssues = /\b(claim|claiming)\b.*\b(not work|error|issue|problem)\b(?!.*\b(when|what)\b)/i;
const transactionIssues = /\b(transaction|refund|sent|transfer|overpaid)\b.*\b(issue|problem|error|stuck)\b(?!.*\b(how to|what is)\b)/i;

// GIF lists
const wenMoonGifs = [
  'https://c.tenor.com/YZWhYF-xV4kAAAAd/when-moon-admin.gif',
  'https://c.tenor.com/x-kqDAmw2NQAAAAC/parrot-party.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
  'https://media1.tenor.com/m/9idtwWwfCdAAAAAC/wen-when.gif',
  'https://media1.tenor.com/m/LZZfKVHwpoIAAAAC/waiting-penguin.gif',
  'https://media1.tenor.com/m/1vXRFJxqIVgAAAAC/waiting-waiting-patiently.gif',
  'https://media1.tenor.com/m/XIr-1aBPoCEAAAAC/walk-hard-the-dewey-cox-story.gif'
];

const wenLamboGifs = [
  'https://c.tenor.com/_dae-kRV6jUAAAAS/lambo-cardboard.gif',
  'https://c.tenor.com/R6Zf7aUegagAAAAd/lambo.gif',
];

const meaningOfLifeGifs = [
  'https://pa1.narvii.com/6331/0e0ef4cfaf24742e0ca39e79a4df2a1aff6f928c_hq.gif',
  'https://i.giphy.com/media/dYgDRfc61SGtO/giphy.webp',
  'https://i.giphy.com/media/OY9XK7PbFqkNO/giphy.webp',
  'https://media1.tenor.com/m/Qc-OTTAsDnAAAAAd/best-field-day-ever.gif'
];

const workingOnItGifs = [
  'Soon™\nhttps://media1.tenor.com/m/RXGEDEM_odoAAAAC/burstofenergy.gif',
  'Soon™\nhttps://media1.tenor.com/m/GS--K_H775kAAAAC/gardener-expert.gif',
  'Soon™\nhttps://media1.tenor.com/m/OiuNG8MQKkYAAAAC/nature-flower.gif',
  'Soon™\nhttps://media1.tenor.com/m/W42sxw9yTZkAAAAC/ponste9.gif',
  'Soon™\nhttps://media1.tenor.com/m/1ZPySWYcQkAAAAAC/cem-gif.gif',
  'Soon™\nhttps://media1.tenor.com/m/vo2C5ig9SIMAAAAd/erkenci-kus-sanem.gif',
  'Soon™\nhttps://media1.tenor.com/m/CmogjUfSyckAAAAd/aum-animation-andy-pirki.gif'
];

const wenDudeGifs = [
  'https://media1.tenor.com/m/FC_My5JT638AAAAC/the-big-lebowski-the-dude.gif',
  'https://media1.tenor.com/m/GscrdOO29OUAAAAd/the-dude-big-lebowski.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZnaWkyOTQ2aDE3ZWgzejB1bnFhM3JrZGFxdWZtNXpwbmljbDljaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lnDvZtsnWfnnX4T0KA/giphy-downsized-large.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdGl6NTdwemdzNDM0eDVha3I1eXFraWU2ZXVreXQ1MmJlY2Q3MHc0ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/J6JDizWgG3bX704JEU/giphy-downsized-large.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWdpZ3U3b3pzb3RmOHB4cHpkZ2s0NDczYXdzbmZ5NGpyMmt1bjRjaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bueYrEU0GcwzTKo/giphy.gif',
  'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTR1ZDk2ZGRjNWhidzl2djUxM3U1bG9pODV4NDhsNHFhNXVraTR4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hzrvwvnbgIV6E/giphy.gif',
];

const celebratoryGifs = [
  'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnxK/giphy.gif',
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif',
  'https://media.giphy.com/media/YTbZzCkRQCEJa/giphy.gif',
  'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif',
  'https://media.giphy.com/media/x0qP0643fys3wnt4uP/giphy.gif',
  'https://media.giphy.com/media/3o7TKrpHvISw8L2Bio/giphy.gif',
  'https://media.giphy.com/media/xT5LMQ8rHYTDGFG07e/giphy.gif',
  'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
  'https://media.giphy.com/media/3o6UB7MOoxIfHet9PW/giphy.gif'
];

const pickMoon = pickFromList(wenMoonGifs);
const pickLambo = pickFromList(wenLamboGifs);
const pickMeaningOfLife = pickFromList(meaningOfLifeGifs);
const pickWorkingOnIt = pickFromList(workingOnItGifs);
const pickDude = pickFromList(wenDudeGifs);

// Map to store recent messages
const recentMessages = new Map();

async function handleMessage(message) {
  try {
    const { author, content, member, channel } = message;

    if (message.author.bot) {
      console.log('Do not reply to bots', message.author.tag);
      return;
    }
    if (message.type !== MessageType.Default && message.type !== MessageType.Reply) {
      console.log('Can only interact with default messages and replies', message.type);
      return;
    }
    console.log(message.type);
    if (message.type !== MessageType.Default) {
      console.log('Can only interact with default messages', message.type);
      return;
    }
    if (channel.type === ChannelType.DM) {
      message.reply(
        codeBlock(cowsay.say({ text: "I am a bot and can't reply, beep bop" })),
      );
      return;
    }
    
    await handleScamMessage(message);

    if (noGmAllowed.test(message.content) && message.channel.id !== GM_CHANNEL_ID) {
      await message.reply(
        'Please plant🌱 your `gm` and `gn` to the <#' + GM_CHANNEL_ID + '> channel',
      );
      if (message.deletable) {
        await message.delete();
      }
    } else if (noHello.test(message.content) && message.channel.id !== GM_CHANNEL_ID) {
      await message.reply(
        `${helloMsgReply(
          message.content,
        )} nice to see you fellow Gardener! Next time please plant 🌱 your \`hi\` messages in the <#${GM_CHANNEL_ID}> channel`,
      );
      if (message.deletable) {
        await message.delete();
      }
    } else if (wenMoon.test(message.content)) {
      await message.reply(pickMoon());
    } else if (wenLambo.test(message.content)) {
      await message.reply(pickLambo());
    } else if (meaningOfLife.test(message.content)) {
      await message.reply(pickMeaningOfLife());
    } else if (wenNetwork.test(message.content)) {
      await message.reply(pickWorkingOnIt());
    } else if (wenDuneAnalytics.test(message.content)) {
      await message.reply(
        "Check out the official dune dashboard 📊 here: <https://dune.com/garden_finance/gardenfinance>"
      );
    } else if (wenDude.test(message.content)) {
      await message.reply(pickDude());
    } else if (wenStake.test(message.content)) {
      await message.reply(
        'SEED Staking is live🌺 at <https://garden.finance/stake/>!\n\nYou can stake in increments of 2,100 SEED for 6 month, 12 month, 24 months, 48 months or permanently.\nYou can also burn 21,000 SEED for an Gardener Pass NFT for maximum voting power.\n\n For more info, and to start staking, visit <https://garden.finance/stake/>.'
      );
    } else if (wenVote.test(message.content)) {
      await message.reply(
        'Garden Snapshot can be found at <https://snapshot.org/#/gardenfinance.eth>. SEED stakers will eventually be able to vote on their favorite fillers. For more details, check out <https://garden.finance/blogs/market-making-and-staking/>',
      );
    } else if (contractAddress.test(message.content)) {
      await message.channel.send({ embeds: [ADDRESSES_EMBEDDED_MSG] });
    } else if (totalSupply.test(message.content)) {
      await message.reply(
        "SEED's total supply is 147,000,000.\n\nKeep in mind not everything will be in circulation at launch. For more info, check <https://garden.finance/blogs/wbtc-garden-introducing-seed/>",
      );
    } else if (howToClaim.test(message.content)) {
      await message.reply(
        "To claim staked SEED 🌱 rewards or season rewards, visit <https://garden.finance/stake/>\n\n",
      );
    } else if (wenDefillama.test(message.content)) {
      await message.reply(
        "We are 🌸live🌸 on defillama, check it out!\n<https://defillama.com/protocol/garden>",
      );
    } else if (stakingIssues.test(message.content)) {
      await message.reply(`If you are having issues with staking, please open a support ticket in <#${SUPPORT_CHANNEL_ID}>.`);
    } else if (swapIssues.test(message.content)) {
      await message.reply(`If you're experiencing issues with an in progress swap, please open a support ticket in <#${SUPPORT_CHANNEL_ID}> and include your order ID.`);
    } else if (claimingIssues.test(message.content)) {
      await message.reply(`If you are having issues claiming $SEED, please open a support ticket in <#${SUPPORT_CHANNEL_ID}>.`);
    } else if (transactionIssues.test(message.content)) {
      await message.reply(`If you have questions about a transaction or need help with a refund, please provide your order ID and open a support ticket in <#${SUPPORT_CHANNEL_ID}>`);
    }
  } catch (e) {
    console.error('Something failed handling a message', e);
  }
}

function isTargetedScamMessage(message, hasOnlyBaseRole, hasMentions, hasExternalUrl) {
  const hasDmRequest = /\b(?:dm|message)\s+me\b/i.test(message.content);
  return hasOnlyBaseRole && hasMentions && (hasExternalUrl || hasDmRequest);
}

function isSuspectedScammer(userId) {
  const scammer = suspectedScammers.get(userId);
  return scammer && scammer.timeout > Date.now();
}

async function handleScamMessage(message) {
  const { author, content, channel, member } = message;
  const key = `${author.id}:${content}`;

  // Check if all mentioned users have only the base role
  const mentionedUsersHaveOnlyBaseRole = message.mentions.users.size > 0 
    ? await Promise.all(
        message.mentions.users.map(async (user) => {
          const member = await message.guild.members.fetch(user);
          return member.roles.cache.size === 2 && member.roles.cache.has(BASE_ROLE_ID);
        })
      ).then(results => results.every(Boolean))
    : false;
  const isScamUser = userDisplayName.some(pattern => pattern.test(member.displayName));
  const isScamContent = scamPatterns.some(pattern => pattern.test(message.content));
  const hasMentions = (message.mentions.users.size > 0 && mentionedUsersHaveOnlyBaseRole) || message.mentions.everyone;
  const hasAnyMentions = (message.mentions.users.size > 0) || message.mentions.everyone;
  const hasExternalUrl = urlPattern.test(message.content) || internalUrl.test(message.content);
  const userRoles = message.member.roles.cache;
  // Check if the user has only the base role
  const hasOnlyBaseRole = userRoles.size === 2 && userRoles.has(BASE_ROLE_ID);
      
  if (!recentMessages.has(key)) {
    recentMessages.set(key, new Set());
  }

  const channels = recentMessages.get(key);
  channels.add(channel.id);

  // If the same message appears in more than 2 channels, quarantine it
  if (channels.size > 2 && hasOnlyBaseRole) {
    await quarantineMessage(message, channels);
    return;
  }
  setTimeout(() => {
    channels.delete(channel.id);
    if (channels.size === 0) {
      recentMessages.delete(key);
    }
  }, 3600000); // 1 hour in milliseconds

  const isTargetedScam = isTargetedScamMessage(message, hasOnlyBaseRole, hasMentions, hasExternalUrl);

  if (((isScamContent || (hasExternalUrl && hasMentions)) && hasOnlyBaseRole) || isTargetedScam || isScamUser) {
    await quarantineMessage(message, new Set([channel.id]));
  }

  // Handle repeated mentions and spam occurrences
  if (isSuspectedScammer(author.id)) {
    if (hasAnyMentions) {
      await handleRepeatedMentions(message);
    }
    await handleSpamOccurrences(message);
  }
}

async function quarantineMessage(message, channelIds) {
  try {
    const { guild, author, content, member } = message;
    const scammer = addSuspectedScammer(author.id);
    
    // Delete all instances of the message
    const deletionPromises = Array.from(channelIds).map(async (channelId) => {
      const channel = await guild.channels.fetch(channelId);
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(m => m.author.id === author.id && m.content === content);
      return Promise.all(userMessages.map(async m => 
      {
          if (m.deletable) {
            await m.delete();
          }
      }));
    });
    
    await Promise.all(deletionPromises);
    
    console.log(`Quarantined message from ${author.tag} in ${channelIds.size} channel(s).`);

    const joinDate = member.joinedAt.toDateString();
    const displayName = member.displayName;
    const username = author.username;
    const userId = author.id;
    const accountCreatedAt = author.createdAt.toDateString();
    
    const roles = member.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => role.name)
      .join(', ');

    const originalMessage = content.trim();

    // Create an embed with the provided information
    const warningMessageEmbed = createWarningMessageEmbed(
      accountCreatedAt, joinDate, displayName, username, userId, roles, channelIds, originalMessage,
      scammer.spamOccurrences
    );

    const reportChannel = await guild.channels.fetch(SCAM_CHANNEL_ID);
    if (reportChannel) {
      await sendThreadedReport(reportChannel, author, warningMessageEmbed);
    } else {
      console.error('Report channel not found');
    }
  } catch (error) {
    console.error('Failed to quarantine message or send warning:', error);
  }
}

async function sendThreadedReport(reportChannel, author, warningMessageEmbed) {
  try {
    let threadId = suspiciousUserThreads.get(author.id);
    let thread;

    if (threadId) {
      try {
        thread = await reportChannel.threads.fetch(threadId);
      } catch (error) {
        console.error(`Failed to fetch existing thread for user ${author.id}:`, error);
        thread = null;
      }
    }

    if (!thread) {
      const threadName = `Suspicious Activity - ${author.tag}`;
      try {
        thread = await reportChannel.threads.create({
          name: threadName,
          autoArchiveDuration: 1440, // 1 hour in minutes
          type: ChannelType.PublicThread, // Changed from PrivateThread to PublicThread
          reason: 'New suspicious activity detected'
        });
        suspiciousUserThreads.set(author.id, thread.id);

      } catch (error) {
        console.error(`Failed to create thread for user ${author.id}:`, error);
        // If thread creation fails, send the report to the main channel instead
        await reportChannel.send({ embeds: [warningMessageEmbed] });
        return;
      }
    }

    const banButton = new ButtonBuilder()
      .setCustomId(`ban_${author.id}`)
      .setLabel('Ban User')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(banButton);

    await thread.send({
      content: `Suspicious activity detected for user ${author.tag} (${author.id})`,
      embeds: [warningMessageEmbed],
      components: [actionRow],
      allowedMentions: { parse: [] }
    });
  } catch (error) {
    console.error('Failed to send threaded report:', error);
    // If all else fails, try to send the report to the main channel
    await reportChannel.send({ embeds: [warningMessageEmbed] });
  }
}

function addSuspectedScammer(userId) {
  const existingEntry = suspectedScammers.get(userId);
  const newTimeout = Date.now() + SCAMMER_TIMEOUT_DURATION;
  
  if (existingEntry) {
    existingEntry.timeout = existingEntry.timeout + SCAMMER_TIMEOUT_DURATION;
    existingEntry.spamOccurrences = (existingEntry.spamOccurrences || 0) + 1;
    return existingEntry;
  } else {
    const newEntry = { 
      timeout: newTimeout, 
      offenseCount: 1,
      spamOccurrences: 1,
      mentionCount: 0,
      mentionTimestamp: 0
    };
    suspectedScammers.set(userId, newEntry);
    return newEntry;
  }
}

async function handleSpamOccurrences(message) {
  const { author, guild } = message;
  const scammer = suspectedScammers.get(author.id);

  if (scammer.spamOccurrences >= MAX_SPAM_OCCURRENCES) {
    try {
      const member = await guild.members.fetch(author.id);
      //await member.ban({ days: 1, reason: 'Excessive spam occurrences' });
      await member.kick('Excessive mentions while under suspicion');
      
      const reportChannel = await guild.channels.fetch(SCAM_CHANNEL_ID);
      if (reportChannel) {
        const threadId = suspiciousUserThreads.get(author.id);
        if (threadId) {
          const thread = await reportChannel.threads.fetch(threadId);
          await thread.send(`User ${author.tag} (${author.id}) has been kicked for excessive spam occurrences (${scammer.spamOccurrences}).`);
        } else {
          await reportChannel.send(`User ${author.tag} (${author.id}) has been kicked for excessive spam occurrences (${scammer.spamOccurrences}).`);
        }
      }
    } catch (error) {
      console.error('Failed to ban user for spam occurrences:', error);
    }
  }
}

async function listSuspectedScammers(message) {

  const now = Date.now();
  const activeScammers = Array.from(suspectedScammers.entries())
    .filter(([_, entry]) => entry.timeout > now)
    .map(([userId, entry]) => ({
      userId,
      timeLeft: Math.ceil((entry.timeout - now) / 60000), // minutes
      offenseCount: entry.offenseCount
    }));

  if (activeScammers.length === 0) {
    await message.reply("There are no suspected scammers at the moment.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Suspected Scammers List")
    .setColor("#FF0000")
    .setDescription("Here's a list of currently suspected scammers:");

  activeScammers.forEach(scammer => {
    embed.addFields({
      name: `User ID: ${scammer.userId}`,
      value: `Time left: ${scammer.timeLeft} minutes\nOffense count: ${scammer.offenseCount}`
    });
  });

  await message.reply({ embeds: [embed] });
}
async function handleRepeatedMentions(message) {
  const { author, guild } = message;
  const scammer = suspectedScammers.get(author.id);

  if (!scammer.mentionCount) {
    scammer.mentionCount = 1;
    scammer.mentionTimestamp = Date.now();
  } else {
    const timeSinceLastMention = Date.now() - scammer.mentionTimestamp;
    
    if (timeSinceLastMention < MENTION_COOLDOWN) {
      scammer.mentionCount++;
    } else {
      scammer.mentionCount = 1;
    }
    
    scammer.mentionTimestamp = Date.now();
  }

  if (scammer.mentionCount > MAX_MENTIONS) {
    try {
      const member = await guild.members.fetch(author.id);
      await member.kick('Excessive mentions while under suspicion');
      
      const reportChannel = await guild.channels.fetch(SCAM_CHANNEL_ID);
      if (reportChannel) {
        const threadId = suspiciousUserThreads.get(author.id);
        if (threadId) {
          const thread = await reportChannel.threads.fetch(threadId);
          await thread.send(`User ${author.tag} (${author.id}) has been kicked for excessive mentions (${scammer.mentionCount}) while under suspicion. In the future this will be a ban after some testing.`);
        } else {
          // If no thread exists, create one
          const threadName = `Suspicious Activity - ${author.tag}`;
          const newThread = await reportChannel.threads.create({
            name: threadName,
            autoArchiveDuration: 10080, // 7 days in minutes
            type: ChannelType.PublicThread,
            reason: 'New suspicious activity detected'
          });
          suspiciousUserThreads.set(author.id, newThread.id);
          
          await newThread.send(`User ${author.tag} (${author.id}) has been kicked for excessive mentions (${scammer.mentionCount}) while under suspicion. In the future this will be a ban after some testing.`);
        }
      }
    } catch (error) {
      console.error('Failed to kick user:', error);
    }
  }
}


module.exports = {
  handleMessage,
  handleScamMessage,
  addSuspectedScammer,
  quarantineMessage,
  celebratoryGifs
};