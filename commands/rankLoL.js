const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getString('tag');

    try {
        // Ici tu peux mettre un scraping OP.GG ou une API tierce
        // Exemple fictif :
        const rank = 'Gold IV'; // À remplacer par vrai scraping/API
        const winrate = '52%';  // À remplacer par vrai scraping/API

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}#${tag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: winrate, inline: true }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription(`Impossible de trouver ${pseudo}#${tag}. Vérifiez le pseudo et le tag exact.`)
                    .setColor('#FF0000')
            ]
        });
    }
};
