const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region');

    try {
        // Étape 1 : Récupérer le summonerId
        const summonerResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
            }
        );
        const { id: summonerId, puuid } = summonerResponse.data;

        // Étape 2 : Récupérer les rangs
        const rankResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
            }
        );

        let soloRank = 'Non classé';
        let soloLP = 'N/A';
        let soloWinrate = 'N/A';
        let flexRank = 'Non classé';
        let flexLP = 'N/A';
        let flexWinrate = 'N/A';

        rankResponse.data.forEach((entry) => {
            if (entry.queueType === 'RANKED_SOLO_5x5') {
                soloRank = `${entry.tier} ${entry.rank}`;
                soloLP = `${entry.leaguePoints} LP`;
                soloWinrate = ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(2) + '%';
            } else if (entry.queueType === 'RANKED_FLEX_SR') {
                flexRank = `${entry.tier} ${entry.rank}`;
                flexLP = `${entry.leaguePoints} LP`;
                flexWinrate = ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(2) + '%';
            }
        });

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setTitle(`Rangs de ${pseudo} (${region.toUpperCase()})`)
            .addFields(
                { name: 'Solo/Duo', value: `${soloRank}\n${soloLP}\nWinrate: ${soloWinrate}`, inline: true },
                { name: 'Flex', value: `${flexRank}\n${flexLP}\nWinrate: ${flexWinrate}`, inline: true }
            )
            .setColor('#FFD700')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur rankLoL:', err);
        if (err.response?.status === 404) {
            await interaction.editReply(`Joueur ${pseudo} introuvable sur la région ${region}.`);
        } else if (err.response?.status === 429) {
            await interaction.editReply('Limite de requêtes API dépassée. Réessaie plus tard.');
        } else {
            await interaction.editReply(`Erreur lors de la récupération des rangs de ${pseudo}.`);
        }
    }
};