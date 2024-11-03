const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const gardenSystem = require('../gardenSystem');
const weatherSystem = require('../weather');
const config = require('../config');

function generateGardenPlot(garden = {}) {
  const plots = [];
  const items = [
    { emoji: '🌳', count: garden.trees ?? 0 },
    { emoji: '🌸', count: garden.flowers ?? 0 },
    { emoji: '🌿', count: garden.sprouts ?? 0 },
    { emoji: '🌱', count: garden.seedlings ?? 0 }
  ];

  let itemIndex = 0;
  let currentItemCount = 0;

  for (let i = 0; i < 5; i++) {
    let row = '';
    for (let j = 0; j < 5; j++) {
      if (itemIndex < items.length && currentItemCount < items[itemIndex].count) {
        row += items[itemIndex].emoji;
        currentItemCount++;
      } else {
        itemIndex++;
        currentItemCount = 0;
        if (itemIndex < items.length && items[itemIndex].count > 0) {
          row += items[itemIndex].emoji;
          currentItemCount++;
        } else {
          row += '🟫'; // Light brown empty plot
        }
      }
    }
    plots.push(row);
  }

  return plots.join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('garden')
    .setDescription('Interact with your garden')
    .addSubcommand(subcommand =>
      subcommand
        .setName('water')
        .setDescription('Water your garden'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a cute representation of your garden'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your garden statistics'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('plant')
        .setDescription('Plant seedlings')
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('Number of seedlings to plant')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('scavenge')
        .setDescription('Scavenge for seedlings (once per day)'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('gift')
        .setDescription('Gift seedlings to another user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to gift seedlings to')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('The number of seedlings to gift')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('forecast')
        .setDescription('Get the garden weather forecast for the next 3 days')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let garden;
    try {
      garden = await gardenSystem.getGarden(interaction.user.id);
    } catch (error) {
      console.error('Error retrieving garden:', error);
      await interaction.reply('An error occurred while retrieving your garden. Please try again later.');
      return;
    }

    let weather;
    try {
      weather = await gardenSystem.getCurrentWeather();
    } catch (error) {
      console.error('Error retrieving weather:', error);
      weather = 'Unknown';
    }

    switch (subcommand) {
      case 'view':
        await handleViewCommand(interaction, garden, weather);
        break;
      case 'stats':
        await handleStatsCommand(interaction, garden, weather);
        break;
      case 'plant':
        await handlePlantCommand(interaction, garden, weather);
        break;
      case 'scavenge':
        await handleScavengeCommand(interaction);
        break;
      case 'gift':
        await handleGiftCommand(interaction);
        break;
      case 'forecast':
        await handleForecastCommand(interaction);
        break;
      case 'water':
          try {
            const result = await gardenSystem.waterGarden(interaction.user.id);
            await interaction.reply(result.message);
          } catch (error) {
            console.error('Error watering garden:', error);
            await interaction.reply('An error occurred while trying to water your garden.');
          }
      break;
        
    }
  },
};

async function handleViewCommand(interaction, garden, weather) {
  const gardenPlot = generateGardenPlot(garden);
  const response = `${interaction.user.username}'s Garden:\n\n${gardenPlot}\n\n` +
    `🌱 Seedlings: ${garden.seedlings}\n` +
    `🌿 Sprouts: ${garden.sprouts}\n` +
    `🌸 Flowers: ${garden.flowers}\n` +
    `🌳 Trees: ${garden.trees}\n\n` +
    `Current Weather: ${weather}`;

  await interaction.reply(response);
}

async function handleStatsCommand(interaction, garden, weather) {
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(`${interaction.user.username}'s Garden Stats`)
    .setDescription(`Current Weather: ${weather}`)
    .addFields(
      { name: 'Seedlings', value: garden.seedlings.toString(), inline: true },
      { name: 'Sprouts', value: garden.sprouts.toString(), inline: true },
      { name: 'Flowers', value: garden.flowers.toString(), inline: true },
      { name: 'Trees', value: garden.trees.toString(), inline: true },
      { name: 'Gardener Level', value: garden.gardener_level.toString(), inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

async function handlePlantCommand(interaction, garden, weather) {
  const amount = interaction.options.getInteger('amount');

  if (garden.seedlings < amount) {
    await interaction.reply('You don\'t have enough seedlings to plant!');
    return;
  }

  let successfulPlants = 0;
  let failedPlants = 0;

  for (let i = 0; i < amount; i++) {
    const result = await gardenSystem.plantSeedling(interaction.user.id);
    if (result === 'sprout') {
      successfulPlants++;
    } else {
      failedPlants++;
    }
  }

  let message = `You attempted to plant ${amount} seedling${amount > 1 ? 's' : ''}.\n`;
  message += `Weather: ${weather}\n`;
  message += `${successfulPlants} grew into sprouts! 🌱\n`;
  message += `${failedPlants} failed to grow. 😢\n`;

  await interaction.reply(message);
}

async function handleScavengeCommand(interaction) {
  const result = await gardenSystem.scavengeForSeedlings(interaction.user.id);

  if (result.seedlingsFound > 0) {
    await interaction.reply(`You scavenged and found ${result.seedlingsFound} seedling${result.seedlingsFound > 1 ? 's' : ''}! 🌱`);
  } else {
    const nextScavengeTime = new Date(result.nextScavengeTime).toUTCString();
    await interaction.reply(`You have already scavenged today. You can scavenge again at ${nextScavengeTime} UTC.`);
  }
}

async function handleGiftCommand(interaction) {
  const fromUserId = interaction.user.id;
  const toUser = interaction.options.getUser('user');
  const amount = interaction.options.getInteger('amount');

  if (amount <= 0) {
    await interaction.reply('Please enter a positive number of seedlings to gift.');
    return;
  }

  const success = await gardenSystem.giftSeedlings(fromUserId, toUser.id, amount);

  if (success) {
    await interaction.reply(`You successfully gifted ${amount} seedling${amount > 1 ? 's' : ''} to ${toUser.username}! 🎁`);
  } else {
    await interaction.reply('You do not have enough seedlings to make this gift.');
  }
}

async function handleForecastCommand(interaction) {
  await weatherSystem.checkAndUpdateForecast();
  const forecast = await weatherSystem.getForecast();
  
  const embed = new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('🌿 Garden Weather Forecast 🌿')
    .setDescription('Plan your gardening activities with our 3-day forecast!')
    .setTimestamp();

  forecast.forEach((day, index) => {
    const date = new Date(day.timestamp);
    const dayName = index === 0 ? "Today" : ['Tomorrow', 'In 2 days', 'In 3 days'][index - 1];
    embed.addFields(
      { name: `${dayName} (${date.toDateString()})`, value: `${day.weather} - ${weatherSystem.getWeatherEffect(day.weather)}` }
    );
  });

  await interaction.reply({ embeds: [embed] });
}

async function waterGarden(userId) {
  const now = Date.now();
  
  return new Promise((resolve, reject) => {
    this.db.get("SELECT * FROM user_activity WHERE user_id = ?", [userId], async (err, row) => {
      if (err) reject(err);

      const lastWatered = row ? row.last_watered : 0;
      const oneDay = 24 * 60 * 60 * 1000;

      if (row && now - lastWatered < oneDay) {
        // Already watered today
        resolve({ success: false, message: 'You already watered your garden today!' });
      } else {
        // Update watering time
        this.db.run("INSERT OR REPLACE INTO user_activity (user_id, last_scavenge, next_scavenge_time, last_watered) VALUES (?, ?, ?, ?)", 
          [userId, row?.last_scavenge, row?.next_scavenge_time, now]);

        // Apply growth to the garden
        const growthResult = await this.applyGrowth(userId);
        resolve({ success: true, message: growthResult });
      }
    });
  });
}

async function applyGrowth(userId) {
  const garden = await this.getGarden(userId);

  // Increase chance of plants growing
  const baseGrowthChance = 0.8; // 80% chance to grow
  let successfulGrowth = 0;
  let failedGrowth = 0;

  // Attempt to grow all sprouts into flowers, and flowers into trees
  for (let i = 0; i < garden.sprouts; i++) {
    if (Math.random() < baseGrowthChance) {
      successfulGrowth++;
    } else {
      failedGrowth++;
    }
  }

  // Update garden based on the result
  await this.updateGarden(userId, {
    sprouts: garden.sprouts - successfulGrowth,
    flowers: garden.flowers + successfulGrowth
  });

  return `You successfully watered your garden! 🌿 ${successfulGrowth} sprouts grew into flowers!`;
}


