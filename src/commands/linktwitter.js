const { SlashCommandBuilder } = require('@discordjs/builders');
const gardenSystem = require('../gardenSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('linktwitter')
    .setDescription('Link your Twitter account to earn seedlings from engagements')
    .addStringOption(option => 
      option.setName('handle')
        .setDescription('Your Twitter handle (without the @)')
        .setRequired(true)),

  async execute(interaction) {
    /*
    const twitterHandle = interaction.options.getString('handle');
    try {
      await gardenSystem.linkTwitterAccount(interaction.user.id, twitterHandle);
      await interaction.reply(`Successfully linked Twitter account @${twitterHandle}. You'll now earn seedlings for engaging with specified accounts!`);
    } catch (error) {
      console.error(error);
      await interaction.reply('Failed to link Twitter account. Please make sure the handle is correct and try again.');
    }
      */
    await interaction.reply("Mockup mplemented, but Twitter's free tier is terrible.");

  },
};