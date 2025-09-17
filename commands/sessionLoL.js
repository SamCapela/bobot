const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase();
    const riotApiKey = process.env.RIOT_API_KEY;

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

        const puuid = summonerResp.data.puuid;

        // Étape 2 : Récupérer les 5 derniers matchs
        const matchesResp = await axios.get(
            `https://${matchPlatform}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const matches = matchesResp.data;
        if (!matches.length) {
            return interaction.editReply(`Pas de session en cours pour ${pseudo} sur ${region.toUpperCase()}.`);
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://${matchPlatform}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (!participant) continue;
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo} sur ${region.toUpperCase()}`)
            .setDescription(`${winrate}% (${wins} victoires / ${losses} défaites) sur les 5 dernières parties`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur sessionLoL:', error.response?.data || error);
        await interaction.editReply(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et votre clé Riot API.`);
    }
};
