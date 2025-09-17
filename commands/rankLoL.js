const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase(); // ex: euw, na, kr
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        // 1️⃣ Récupérer le summoner
        const summonerResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerResponse.data.id;

        // 2️⃣ Récupérer le rang
        const rankResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo} [${region.toUpperCase()}]`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et la région.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
        console.error('Erreur rankLoL:', error.response?.data || error.message);
    }
};
