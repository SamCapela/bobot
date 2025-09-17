const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase(); // ex: euw, na, kr
    const riotApiKey = process.env.RIOT_API_KEY;

    // Mapping région pour API v4 et v5
    const platformMap = { euw: 'euw1', na: 'na1', kr: 'kr1' };
    const matchPlatformMap = { euw: 'europe', na: 'americas', kr: 'asia' };
    const platform = platformMap[region];
    const matchPlatform = matchPlatformMap[region];

    if (!platform || !matchPlatform) {
        return interaction.editReply(`Région invalide. Exemples : EUW, NA, KR`);
    }

    try {
        // Étape 1 : Récupérer le summoner
        const summonerResp = await axios.get(
            `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const { id: summonerId, puuid } = summonerResp.data;

        // Étape 2 : Récupérer le rang Solo/Duo
        const rankResp = await axios.get(
            `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const soloDuo = rankResp.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        // Étape 3 : Récupérer les 20 derniers matchs solo/duo pour top champions
        const matchesResp = await axios.get(
            `https://${matchPlatform}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const matches = matchesResp.data;
        const championCounts = {};

        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://${matchPlatform}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (!participant) continue;
            championCounts[participant.championName] = (championCounts[participant.championName] || 0) + 1;
        }

        const topChampions = Object.entries(championCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([champion, count]) => `${champion} (${((count / matches.length) * 100).toFixed(2)}%)`);

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
        console.error('Erreur rankLoL:', error.response?.data || error);
        await interaction.editReply(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et votre clé Riot API.`);
    }
};
