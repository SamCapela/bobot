const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    let gamertag = interaction.options.getString('gamertag');
    gamertag = gamertag.replace('#', ''); // supprime le # si présent
    const riotApiKey = process.env.RIOT_API_KEY;

    console.log(`Recherche Riot API pour: pseudo="${pseudo}", tag="${gamertag}"`);

    try {
        // Étape 1 : Récupérer le PUUID
        const summonerResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(pseudo)}/${encodeURIComponent(gamertag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResponse.data.puuid;

        // Étape 2 : Récupérer l'ID du summoner
        const summonerDetails = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerDetails.data.id;

        // Étape 3 : Récupérer le rang Solo/Duo
        const rankResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        // Étape 4 : Récupérer les champions les plus joués (20 dernières parties)
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchResponse.data;
        const championCounts = {};
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (!participant) continue;
            const champion = participant.championName;
            championCounts[champion] = (championCounts[champion] || 0) + 1;
        }

        const topChampions = Object.entries(championCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([champion, count]) => `${champion} (${((count / matches.length) * 100).toFixed(2)}%)`);

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}#${gamertag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true },
                { name: 'Champions les plus joués', value: topChampions.join('\n') || 'Aucun' }
            )
            .setColor('#FFD700')
            .setThumbnail('https://cdn.discordapp.com/attachments/LoL_icon.png');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(error.response?.data || error.message);
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${pseudo}#${gamertag}. Vérifiez le pseudo et le tag exact (chiffres après #).`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};
