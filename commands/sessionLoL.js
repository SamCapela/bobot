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

        const recentMatches = $('.GameItemWrap').slice(0, 5); // les 5 dernières parties
        if (!recentMatches.length) {
            return interaction.editReply(`Aucune partie récente trouvée pour ${pseudo}#${tag}.`);
        }

        let wins = 0, losses = 0;
        recentMatches.each((i, el) => {
            const result = $(el).find('.GameResult').text().trim();
            if (result === '승') wins++;
            else if (result === '패') losses++;
        });

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo}#${tag}`)
            .setDescription(`${wins} victoires / ${losses} défaites — Winrate: ${winrate}%`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur sessionLoL:', error.message || error);
        await interaction.editReply(`Impossible de récupérer la session de ${pseudo}#${tag}.`);
    }
};
