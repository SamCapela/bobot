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
        const puuid = summonerResponse.data.puuid;

        // Étape 2 : Récupérer les 5 derniers matchs Solo/Duo
        const matchIdsResp = await axios.get(
            `https://${matchEndpointRegion[region]}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchIdsResp.data;

        if (!matches.length) {
            return interaction.editReply(`Pas de session en cours pour ${pseudo} sur ${region.toUpperCase()}.`);
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://${matchEndpointRegion[region]}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo} sur ${region.toUpperCase()}`)
            .setDescription(`${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur sessionLoL:', error.response?.data || error.message);
        await interaction.editReply(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et la région.`);
    }
};
