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

        const recentGames = $('.GameItemWrap');
        if (!recentGames.length) {
            return await interaction.editReply(`Pas de parties récentes trouvées pour ${pseudo} sur ${region}.`);
        }

        let wins = 0, losses = 0;
        recentGames.each((i, el) => {
            const result = $(el).find('.GameResult').text().trim();
            if (result === '승리') wins++;
            else if (result === '패배') losses++;
        });

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle(`Session récente de ${pseudo}`)
            .setDescription(`${wins} victoires / ${losses} défaites (${winrate}%)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur sessionLoL:', err);
        await interaction.editReply(`Impossible de récupérer les parties de ${pseudo} sur ${region}.`);
    }
};
