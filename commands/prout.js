const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prout')
        .setDescription('Test pour vérifier que les nouveautés sont bien mises à jour'),

    async execute(interaction) {
        await interaction.reply('💨 Prout ! Commande bien exécutée.');
    },
};
