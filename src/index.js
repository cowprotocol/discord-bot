require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkTransfers } = require('./transactionMonitor');
const config = require('./config');
const { handleMessage,celebratoryGifs } = require('./messageHandlers');
const { REST, Routes } = require('discord.js');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();
client.suspectedScammers = new Map(); // Add this line to store suspectedScammers
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
  } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: client.commands.map(command => command.data.toJSON()) },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  setInterval(() => checkTransfers(client), config.POLL_INTERVAL);
});

client.on('messageCreate', handleMessage);

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
      await command.execute(interaction);
  } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('ban_')) {
    const userId = interaction.customId.split('_')[1];
    const guild = interaction.guild;
    const moderator = interaction.user;
    if (isAboveBaseRole(interaction.member)) {
      try {
        // Ban the user
        await guild.members.ban(userId, { reason: 'Banned due to suspicious activity' });
        
        // Log the action in the thread
        const logEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('User Banned')
          .setDescription(`User <@${userId}> has been banned.`)
          .addFields(
            { name: 'Banned by', value: `${moderator.tag} (${moderator.id})` },
            { name: 'Ban Time', value: new Date().toUTCString() }
          );
        
        await interaction.reply({ embeds: [logEmbed] });

        // Send a random celebratory GIF
        const randomGif = celebratoryGifs[Math.floor(Math.random() * celebratoryGifs.length)];
        await interaction.followUp({ content: `Nice Ban! Mission accomplished! 🎉`, files: [randomGif] });
        
        // Optional: Archive the thread
        await interaction.channel.setArchived(true, 'User has been banned');
      } catch (error) {
        console.error('Failed to ban user:', error);
        await interaction.reply({ content: 'Failed to ban user. Please check logs.', ephemeral: true });
      }
    }
    else {
      await interaction.reply("You don't have permission to use this command.");
    }
  }
});

client.login(process.env.BOT_TOKEN).catch(err => {
  console.error('Failed to login:', err);
});

function isAboveBaseRole(member) {
  console.log(`Checking permissions for user: ${member.user.tag}`);
  
  const baseRole = member.guild.roles.cache.get(config.BASE_ROLE_ID);
  if (!baseRole) {
    console.log(`Base role with ID ${config.BASE_ROLE_ID} not found in the guild.`);
    return false;
  }
  
  console.log(`Base role: ${baseRole.name} (Position: ${baseRole.position})`);
  console.log(`User's highest role: ${member.roles.highest.name} (Position: ${member.roles.highest.position})`);
  
  const isAbove = member.roles.highest.position > baseRole.position;
  console.log(`Is user's role above base role? ${isAbove}`);
  
  return isAbove;
}