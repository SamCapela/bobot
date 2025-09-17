const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const gamertag = interaction.options.getString('gamertag');
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        // �tape 1 : R�cup�rer le PUUID
        const summonerResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(pseudo)}/${encodeURIComponent(gamertag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResponse.data.puuid;

        // �tape 2 : R�cup�rer l'ID du summoner
        const summonerDetails = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerDetails.data.id;

        // �tape 3 : R�cup�rer le rang Solo/Duo
        const rankResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non class�';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        // �tape 4 : R�cup�rer les champions les plus jou�s (approximation via les 20 derni�res parties)
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`, // Queue 420 = Solo/Duo
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
                { name: 'Champions les plus jou�s', value: topChampions.join('\n') || 'Aucun' }
            )
            .setColor('#FFD700')
            .setThumbnail('https://cdn.discordapp.com/attachments/LoL_icon.png');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${pseudo}#${gamertag}. V�rifiez le pseudo ou gamertag.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};