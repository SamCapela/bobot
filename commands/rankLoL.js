const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riotid'); // attendre [Pseudo]#[Tag]
    const riotApiKey = process.env.RIOT_API_KEY;

    // Séparer pseudo et tag correctement
    const hashIndex = riotId.lastIndexOf('#');
    if (hashIndex === -1) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo]#[Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    const name = riotId.slice(0, hashIndex).trim();
    const tag = riotId.slice(hashIndex + 1).trim();

    try {
        // Récupérer le PUUID via Riot ID
        const summonerResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const puuid = summonerResponse.data.puuid;

        // Récupérer le summoner ID
        const summonerDetails = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const summonerId = summonerDetails.data.id;

        // Récupérer le rang Solo/Duo
        const rankResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${name}#${tag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur rankLoL:', error.response?.data || error.message);
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${name}#${tag}. Vérifiez le pseudo et le tag exact.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};
