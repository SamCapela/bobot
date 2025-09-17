const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('pseudo'); // ici on met GLX Jsaipo#GLX
    const riotApiKey = process.env.RIOT_API_KEY;

    // Split pseudo et tag
    const [name, tagline] = riotId.split('#');
    if (!name || !tagline) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo]#[Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    try {
        // Étape 1 : Récupérer le PUUID via Account API
        const accountResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tagline)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = accountResponse.data.puuid;

        // Étape 2 : Récupérer le summonerId
        const summonerResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerResponse.data.id;

        // Étape 3 : Rang Solo/Duo
        const rankResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const soloDuo = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        // Étape 4 : Top champions (20 derniers matchs solo)
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const championCounts = {};
        for (const matchId of matchResponse.data) {
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
            .map(([champion, count]) => `${champion} (${((count / matchResponse.data.length) * 100).toFixed(2)}%)`);

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${riotId}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true },
                { name: 'Champions les plus joués', value: topChampions.join('\n') || 'Aucun' }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur rankLoL:', error.response?.data || error.message);
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${riotId}. Vérifiez pseudo et tag exact.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};
