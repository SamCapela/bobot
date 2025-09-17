const axios = require('axios');
const cheerio = require('cheerio');
const { EmbedBuilder } = require('discord.js');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase();
    const url = `https://${region}.op.gg/summoners/${encodeURIComponent(pseudo)}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const rank = $('.TierRank').first().text().trim() || 'Non classé';
        const winrate = $('.WinRatio').first().text().trim() || 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate', value: winrate, inline: true },
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur rankLoL:', err);
        await interaction.editReply(`Impossible de récupérer les infos de ${pseudo} sur la région ${region}.`);
    }
};
