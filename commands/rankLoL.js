const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase();
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        const summonerResp = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summoner = summonerResp.data;

        const rankResp = await axios.get(
            `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const soloDuo = rankResp.data.find(q => q.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const wins = soloDuo ? soloDuo.wins : 0;
        const losses = soloDuo ? soloDuo.losses : 0;
        const winrate = soloDuo ? ((wins / (wins + losses)) * 100).toFixed(2) : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo} sur ${region.toUpperCase()}`)
            .setDescription(`Rang Solo/Duo : ${rank}\nWinrate : ${winrate}% (${wins}V/${losses}D)`)
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur rankLoL:', error.response?.data || error.message);
        await interaction.editReply(
            `Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}.\nVérifiez le pseudo et la région.`
        );
    }
};
