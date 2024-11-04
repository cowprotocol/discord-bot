const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sample')
        .setDescription('Sample Command'),
    async execute(interaction) {

        await interaction.reply("Not implemented yet. Future slash commands will be implemented in the future.");

    },
};