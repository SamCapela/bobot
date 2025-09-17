const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getString('tag');

    try {
        // Exemple fictif
        const winrate = '48%'; // � remplacer par vrai scraping/API
        const lastGames = '2 victoires / 3 d�faites'; // � remplacer par vrai scraping/API

        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo}#${tag}`)
            .setDescription(`${winrate} (${lastGames})`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription(`Impossible de trouver ${pseudo}#${tag}. V�rifiez le pseudo et le tag exact.`)
                    .setColor('#FF0000')
            ]
        });
    }
};
