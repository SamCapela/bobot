const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

const regionEndpoints = {
    na: 'na1',
    euw: 'euw1',
    eune: 'eun1',
    kr: 'kr',
    jp: 'jp1',
};

const matchEndpointRegion = {
    na: 'americas',
    euw: 'europe',
    eune: 'europe',
    kr: 'asia',
    jp: 'asia',
};

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region')?.toLowerCase() || 'euw';
    const riotApiKey = process.env.RIOT_API_KEY;

    if (!regionEndpoints[region]) {
        return interaction.editReply(`Région invalide. Utilisez: ${Object.keys(regionEndpoints).join(', ')}`);
    }

    try {
        // Étape 1 : Récupérer le summoner
        const summonerResponse = await axios.get(
            `https://${regionEndpoints[region]}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerResponse.data.id;
        const puuid = summonerResponse.data.puuid;

        // Étape 2 : Récupérer le rang Solo/Duo
        const rankResponse = await axios.get(
            `https://${regionEndpoints[region]}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        // Étape 3 : Top champions (20 derniers matchs)
        const matchIdsResp = await axios.get(
            `https://${matchEndpointRegion[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchIdsResp.data;
        const championCounts = {};

        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://${matchEndpointRegion[region]}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            const champion = participant.championName;
            championCounts[champion] = (championCounts[champion] || 0) + 1;
        }

        const topChampions = Object.entries(championCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([champion, count]) => `${champion} (${((count / matches.length) * 100).toFixed(2)}%)`);

        // Embed Discord
        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo} sur ${region.toUpperCase()}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true },
                { name: 'Champions les plus joués', value: topChampions.join('\n') || 'Aucun' }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur rankLoL:', error.response?.data || error.message);
        await interaction.editReply(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et la région.`);
    }
};
