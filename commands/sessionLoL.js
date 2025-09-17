const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        // Récupérer le summoner par pseudo
        const summonerResponse = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const { puuid } = summonerResponse.data;

        // Récupérer les 5 derniers matchs solo
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );

        const matches = matchResponse.data;
        if (!matches.length) {
            const embed = new EmbedBuilder()
                .setTitle('Session LoL')
                .setDescription(`Pas de session récente pour "${pseudo}".`)
                .setColor('#FF0000');
            return interaction.editReply({ embeds: [embed] });
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle('Session LoL')
            .setDescription(`${pseudo} : ${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00')
            .setThumbnail('https://cdn.discordapp.com/attachments/LoL_icon.png');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur sessionLoL:', error.
