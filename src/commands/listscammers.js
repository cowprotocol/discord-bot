const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listscammers')
        .setDescription('Lists suspected scammers'),
    async execute(interaction) {

        await interaction.reply("Not implemented yet. Future slash commands will be implemented in the future.");

    },
};