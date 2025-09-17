const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getString('tag').replace('#', '');
    const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(pseudo)}%23${encodeURIComponent(tag)}`;

    try {
        const { data } = await axios.get(opggUrl);
        const $ = cheerio.load(data);

        const rank = $('.TierRank').first().text().trim() || 'Non classé';
        const lp = $('.LP').first().text().trim() || '';
        const winRate = $('.WinRatio').first().text().trim() || '';

        if (!rank) {
            return interaction.editReply(`Impossible de trouver ${pseudo}#${tag} sur OP.GG.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}#${tag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'LP', value: lp || 'N/A', inline: true },
                { name: 'Winrate', value: winRate || 'N/A', inline: true }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur rankLoL:', error.message || error);
        await interaction.editReply(`Impossible de récupérer les infos de ${pseudo}#${tag}.`);
    }
};
