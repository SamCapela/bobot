const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase(); // ex: euw, na, kr
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        // 1️⃣ Récupérer le summoner
        const summonerResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResponse.data.puuid;

        // 2️⃣ Récupérer les 5 dernières parties Solo/Duo
        const matchResponse = await axios.get(
            `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchResponse.data;

        if (!matches.length) {
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('Session LoL')
                    .setDescription(`Pas de parties récentes pour ${pseudo} [${region.toUpperCase()}]`)
                    .setColor('#FF0000')]
            });
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (participant.win) wins++; else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle('Session LoL')
            .setDescription(`${pseudo} [${region.toUpperCase()}] : ${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}. Vérifiez le pseudo et la région.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
        console.error('Erreur sessionLoL:', error.response?.data || error.message);
    }
};
