const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region');

    try {
        // Étape 1 : Récupérer le puuid
        const summonerResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
            }
        );
        const { puuid } = summonerResponse.data;

        // Étape 2 : Récupérer les 20 dernières parties
        const matchListResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
            {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
            }
        );
        const matchIds = matchListResponse.data;

        if (!matchIds.length) {
            return await interaction.editReply(`Aucune partie récente trouvée pour ${pseudo} sur ${region}.`);
        }

        // Étape 3 : Analyser les parties
        let wins = 0;
        let losses = 0;

        for (const matchId of matchIds) {
            const matchResponse = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                {
                    headers: { 'X-Riot-Token': RIOT_API_KEY },
                }
            );
            const matchData = matchResponse.data;
            const participant = matchData.info.participants.find((p) => p.puuid === puuid);
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setTitle(`Session récente de ${pseudo} (${region.toUpperCase()})`)
            .setDescription(`${wins} victoires / ${losses} défaites (${winrate}%)`)
            .setColor('#00FF00')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur sessionLoL:', err);
        if (err.response?.status === 404) {
            await interaction.editReply(`Joueur ${pseudo} introuvable sur la région ${region}.`);
        } else if (err.response?.status === 429) {
            await interaction.editReply('Limite de requêtes API dépassée. Réessaie plus tard.');
        } else {
            await interaction.editReply(`Erreur lors de la récupération des parties de ${pseudo}.`);
        }
    }
};